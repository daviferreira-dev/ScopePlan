"""ERS (Especificação de Requisitos de Software) document generator.

Generates PDF and DOCX files from project requirements, filtered by
topic types and/or specific requirement IDs.
"""

import io
from datetime import datetime, timezone

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH


# Topic type display names and sort order
TOPIC_LABELS = {
    'funcional': 'Requisitos Funcionais',
    'nao_funcional': 'Requisitos Não Funcionais',
    'negocio': 'Regras de Negócio',
    'restricao': 'Restrições',
}

TOPIC_ORDER = ['funcional', 'nao_funcional', 'negocio', 'restricao']

PRIORITY_LABELS = {
    'baixa': 'Baixa',
    'media': 'Média',
    'alta': 'Alta',
    'critica': 'Crítica',
}

STATUS_LABELS = {
    'rascunho': 'Rascunho',
    'em_revisao': 'Em Revisão',
    'aprovado': 'Aprovado',
    'aprovado_com_ressalvas': 'Aprovado com Ressalvas',
    'rejeitado': 'Rejeitado',
}


def _group_by_topic(requirements):
    """Group requirements by tipo, ordered by TOPIC_ORDER."""
    groups = {}
    for req in requirements:
        tipo = req.get('tipo', 'funcional') or 'funcional'
        groups.setdefault(tipo, []).append(req)
    ordered = []
    for tipo in TOPIC_ORDER:
        if tipo in groups:
            ordered.append((tipo, groups[tipo]))
    # Any unknown types at the end
    for tipo in groups:
        if tipo not in TOPIC_ORDER:
            ordered.append((tipo, groups[tipo]))
    return ordered


def _build_docx(project, requirements, topic_ids=None, requirement_ids=None):
    """Build a DOCX document for the ERS.

    Args:
        project: Project dict with 'nome', 'descricao', 'gestor', 'nome_cliente'
        requirements: List of requirement dicts
        topic_ids: Optional list of tipo strings to include
        requirement_ids: Optional list of requirement IDs to include

    Returns:
        bytes: DOCX file content
    """
    # Filter requirements
    filtered = requirements
    if requirement_ids:
        rid_set = set(requirement_ids)
        filtered = [r for r in filtered if r['id'] in rid_set]
    if topic_ids:
        filtered = [r for r in filtered if r.get('tipo') in topic_ids]

    groups = _group_by_topic(filtered)

    doc = Document()

    # Title
    title = doc.add_heading(f'ERS — {project.get("nome", "Projeto")}', level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Project info
    info = doc.add_paragraph()
    info.alignment = WD_ALIGN_PARAGRAPH.CENTER
    gestor = project.get('gestor', {})
    info.add_run(f'Gestor: {gestor.get("nome", "N/A")}\n')
    info.add_run(f'Cliente: {project.get("nome_cliente", "N/A")}\n')
    info.add_run(f'Data: {datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")}\n')

    # Description
    if project.get('descricao'):
        doc.add_heading('1. Descrição do Projeto', level=1)
        doc.add_paragraph(project['descricao'])

    # Requirements by topic
    section_num = 2
    total_count = 0
    for tipo, reqs in groups:
        label = TOPIC_LABELS.get(tipo, tipo)
        doc.add_heading(f'{section_num}. {label}', level=1)
        for idx, req in enumerate(reqs, 1):
            total_count += 1
            codigo = req.get('codigo') or f'{idx:03d}'
            heading = doc.add_heading(
                f'{section_num}.{idx} {codigo} — {req.get("titulo", "")}',
                level=2
            )
            # Description
            if req.get('descricao') or '':
                doc.add_paragraph(req['descricao'])
            # Metadata table
            table = doc.add_table(rows=3, cols=2)
            table.style = 'Light Grid Accent 1'
            table.cell(0, 0).text = 'Prioridade'
            table.cell(0, 1).text = PRIORITY_LABELS.get(
                req.get('prioridade') or 'media', req.get('prioridade') or '')
            table.cell(1, 0).text = 'Status'
            table.cell(1, 1).text = STATUS_LABELS.get(
                req.get('status') or '', req.get('status') or '')
            table.cell(2, 0).text = 'Categoria'
            table.cell(2, 1).text = req.get('categoria') or '—'
            doc.add_paragraph()  # spacing
        section_num += 1

    # Summary
    doc.add_heading('Resumo', level=1)
    doc.add_paragraph(
        f'Total de requisitos: {len(filtered)}'
    )
    for tipo, reqs in groups:
        label = TOPIC_LABELS.get(tipo, tipo)
        doc.add_paragraph(f'{label}: {len(reqs)}')

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def _build_pdf(project, requirements, topic_ids=None, requirement_ids=None):
    """Build a PDF document for the ERS.

    Uses reportlab if available, otherwise falls back to a simple
    text-based PDF. Falls back gracefully if reportlab is not installed.

    Args:
        project: Project dict
        requirements: List of requirement dicts
        topic_ids: Optional list of tipo strings
        requirement_ids: Optional list of requirement IDs

    Returns:
        bytes: PDF file content
    """
    try:
        from xml.sax.saxutils import escape as xml_escape
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            PageBreak,
        )
        from reportlab.lib import colors
    except ImportError:
        # reportlab not installed — generate a minimal PDF manually
        return _build_minimal_pdf(project, requirements, topic_ids, requirement_ids)

    # Filter requirements
    filtered = requirements
    if requirement_ids:
        rid_set = set(requirement_ids)
        filtered = [r for r in filtered if r['id'] in rid_set]
    if topic_ids:
        filtered = [r for r in filtered if r.get('tipo') in topic_ids]

    groups = _group_by_topic(filtered)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('ERSTitle', parent=styles['Title'],
                                 fontSize=18, spaceAfter=12)
    h1_style = ParagraphStyle('ERSH1', parent=styles['Heading1'],
                               fontSize=14, spaceAfter=8)
    h2_style = ParagraphStyle('ERSH2', parent=styles['Heading2'],
                               fontSize=12, spaceAfter=6)

    elements = []

    # Title
    elements.append(Paragraph(
        f'ERS — {project.get("nome", "Projeto")}', title_style))
    elements.append(Spacer(1, 12))

    # Project info
    gestor = project.get('gestor', {})
    info_text = (
        f'Gestor: {gestor.get("nome", "N/A")}<br/>'
        f'Cliente: {project.get("nome_cliente", "N/A")}<br/>'
        f'Data: {datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")}'
    )
    elements.append(Paragraph(info_text, styles['Normal']))
    elements.append(Spacer(1, 12))

    if project.get('descricao'):
        elements.append(Paragraph('1. Descrição do Projeto', h1_style))
        elements.append(Paragraph(xml_escape(project.get('descricao', '')), styles['Normal']))
        elements.append(Spacer(1, 8))

    section_num = 2
    for tipo, reqs in groups:
        label = TOPIC_LABELS.get(tipo, tipo)
        elements.append(Paragraph(f'{section_num}. {label}', h1_style))
        for idx, req in enumerate(reqs, 1):
            codigo = req.get('codigo') or f'{idx:03d}'
            elements.append(Paragraph(
                xml_escape(f'{section_num}.{idx} {codigo} — {req.get("titulo", "")}'),
                h2_style))
            if req.get('descricao') or '':
                elements.append(Paragraph(xml_escape(req.get('descricao', '')), styles['Normal']))
            # Metadata
            data = [
                ['Prioridade', PRIORITY_LABELS.get(req.get('prioridade') or 'media', req.get('prioridade') or '')],
                ['Status', STATUS_LABELS.get(req.get('status') or '', req.get('status') or '')],
                ['Categoria', req.get('categoria') or '—'],
            ]
            t = Table(data, colWidths=[4*cm, 12*cm])
            t.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 8))
        section_num += 1

    # Summary
    elements.append(Paragraph('Resumo', h1_style))
    elements.append(Paragraph(f'Total de requisitos: {len(filtered)}', styles['Normal']))
    for tipo, reqs in groups:
        label = TOPIC_LABELS.get(tipo, tipo)
        elements.append(Paragraph(f'{label}: {len(reqs)}', styles['Normal']))

    doc.build(elements)
    return buf.getvalue()


def _build_minimal_pdf(project, requirements, topic_ids=None, requirement_ids=None):
    """Fallback: generate a minimal PDF without reportlab dependency.

    Uses fpdf2 if available, otherwise raises ImportError.
    """
    try:
        from fpdf import FPDF
    except ImportError:
        # Last resort: generate a plain-text PDF header + content
        # PDF spec 1.4 minimal file
        return _build_raw_pdf(project, requirements, topic_ids, requirement_ids)

    # Filter
    filtered = requirements
    if requirement_ids:
        rid_set = set(requirement_ids)
        filtered = [r for r in filtered if r['id'] in rid_set]
    if topic_ids:
        filtered = [r for r in filtered if r.get('tipo') in topic_ids]

    groups = _group_by_topic(filtered)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font('Helvetica', 'B', 18)
    pdf.cell(0, 15, f'ERS - {project.get("nome", "Projeto")}', ln=True, align='C')
    pdf.set_font('Helvetica', '', 10)
    gestor = project.get('gestor', {})
    pdf.cell(0, 6, f'Gestor: {gestor.get("nome", "N/A")}', ln=True, align='C')
    pdf.cell(0, 6, f'Cliente: {project.get("nome_cliente", "N/A")}', ln=True, align='C')
    pdf.ln(10)

    if project.get('descricao'):
        pdf.set_font('Helvetica', 'B', 14)
        pdf.cell(0, 10, '1. Descricao do Projeto', ln=True)
        pdf.set_font('Helvetica', '', 10)
        pdf.multi_cell(0, 5, project['descricao'])
        pdf.ln(5)

    section_num = 2
    for tipo, reqs in groups:
        label = TOPIC_LABELS.get(tipo, tipo)
        pdf.set_font('Helvetica', 'B', 14)
        pdf.cell(0, 10, f'{section_num}. {label}', ln=True)
        for idx, req in enumerate(reqs, 1):
            codigo = req.get('codigo') or f'{idx:03d}'
            pdf.set_font('Helvetica', 'B', 12)
            pdf.cell(0, 8, f'{section_num}.{idx} {codigo} - {req.get("titulo", "")}', ln=True)
            if req.get('descricao') or '':
                pdf.set_font('Helvetica', '', 10)
                pdf.multi_cell(0, 5, req['descricao'])
            pdf.set_font('Helvetica', '', 9)
            pdf.cell(0, 5, f'Prioridade: {PRIORITY_LABELS.get(req.get("prioridade", "media"), "")} | '
                           f'Status: {STATUS_LABELS.get(req.get("status", ""), "")} | '
                           f'Categoria: {req.get("categoria", "-")}',
                      ln=True)
            pdf.ln(3)
        section_num += 1

    return pdf.output()


def _build_raw_pdf(project, requirements, topic_ids=None, requirement_ids=None):
    """Absolute last resort: raw PDF bytes without any library.

    Produces a valid but very minimal PDF 1.4 file.
    """
    lines = [
        f"ERS - {project.get('nome', 'Projeto')}",
        f"Gestor: {project.get('gestor', {}).get('nome', 'N/A')}",
        f"Cliente: {project.get('nome_cliente') or 'N/A'}",
        f"Data: {datetime.now(timezone.utc).strftime('%d/%m/%Y')}",
        "",
        "AVISO: Instale reportlab ou fpdf2 para geracao completa de PDF.",
        "",
    ]
    # Filter
    filtered = requirements
    if requirement_ids:
        rid_set = set(requirement_ids)
        filtered = [r for r in filtered if r['id'] in rid_set]
    if topic_ids:
        filtered = [r for r in filtered if r.get('tipo') in topic_ids]

    for req in filtered:
        lines.append(f"{req.get('codigo', '?')} - {req.get('titulo') or ''}")
        if req.get('descricao') or '':
            lines.append(f"  {req['descricao']}")
        lines.append(f"  Prioridade: {req.get('prioridade', '-')} | Status: {req.get('status', '-')}")
        lines.append("")

    content = "\n".join(lines)

    # Minimal valid PDF
    objects = []
    obj_offsets = []

    def add_obj(data):
        idx = len(objects)
        objects.append(data)
        return idx

    # Object 1: Catalog
    add_obj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj")
    # Object 2: Pages
    add_obj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj")
    # Object 3: Page
    add_obj("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj")

    # Object 4: Content stream
    escaped = content.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
    stream_lines = []
    y = 750
    stream_lines.append("BT")
    stream_lines.append("/F1 10 Tf")
    for line in escaped.split('\n'):
        if y < 50:
            break
        safe = line[:80]  # Truncate long lines
        stream_lines.append(f"1 0 0 1 50 {y} Tm")
        stream_lines.append(f"({safe}) Tj")
        y -= 14
    stream_lines.append("ET")
    stream = '\n'.join(stream_lines)
    add_obj(f"4 0 obj\n<< /Length {len(stream)} >>\nstream\n{stream}\nendstream\nendobj")

    # Object 5: Font
    add_obj("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj")

    # Build PDF
    pdf = b"%PDF-1.4\n"
    for i, obj in enumerate(objects):
        offset = len(pdf)
        obj_offsets.append(offset)
        pdf += obj.encode() + b"\n"

    # xref
    xref_offset = len(pdf)
    pdf += b"xref\n"
    pdf += f"0 {len(objects) + 1}\n".encode()
    pdf += b"0000000000 65535 f \n"
    for off in obj_offsets:
        pdf += f"{off:010d} 00000 n \n".encode()

    pdf += b"trailer\n"
    pdf += f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n".encode()
    pdf += b"startxref\n"
    pdf += f"{xref_offset}\n".encode()
    pdf += b"%%EOF\n"

    return pdf


def generate_ers_docx(project, requirements, topic_ids=None, requirement_ids=None):
    """Generate ERS as DOCX format.

    Args:
        project: Project dict
        requirements: List of requirement dicts
        topic_ids: Optional list of topic types to include
        requirement_ids: Optional list of requirement IDs to include

    Returns:
        tuple: (filename, bytes_content)
    """
    project_name = project.get('nome', 'projeto').replace(' ', '_')
    filename = f'ERS_{project_name}.docx'
    content = _build_docx(project, requirements, topic_ids, requirement_ids)
    return filename, content


def generate_ers_pdf(project, requirements, topic_ids=None, requirement_ids=None):
    """Generate ERS as PDF format.

    Tries reportlab first, then fpdf2, then raw minimal PDF.

    Args:
        project: Project dict
        requirements: List of requirement dicts
        topic_ids: Optional list of topic types to include
        requirement_ids: Optional list of requirement IDs to include

    Returns:
        tuple: (filename, bytes_content)
    """
    project_name = project.get('nome', 'projeto').replace(' ', '_')
    filename = f'ERS_{project_name}.pdf'
    content = _build_pdf(project, requirements, topic_ids, requirement_ids)
    return filename, content
