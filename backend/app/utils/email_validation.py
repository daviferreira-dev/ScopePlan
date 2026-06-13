"""Validação de deliverability de e-mail: formato + domínio real (registro MX/A).

Não envia nada — apenas confirma que o domínio existe e aceita e-mails, evitando
cadastros com domínios digitados errado (ex.: gmal.com) ou inexistentes.
"""
import re
import dns.resolver
import dns.exception

# Formato básico (a marshmallow.fields.Email já cobre, aqui é defesa extra)
_EMAIL_RE = re.compile(r'^[^@\s]+@([^@\s]+\.[^@\s]+)$')

# Cache simples por domínio para não repetir lookup DNS na mesma execução
_mx_cache: dict[str, bool] = {}


def _domain_accepts_mail(domain: str) -> bool:
    """True se o domínio tem registro MX (ou A/AAAA como fallback, conforme RFC 5321).

    Fail-open em erros de rede/timeout: não bloqueia usuário por DNS instável,
    mas bloqueia domínios que comprovadamente não existem.
    """
    if domain in _mx_cache:
        return _mx_cache[domain]

    result = True
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        result = len(answers) > 0
    except dns.resolver.NoAnswer:
        # Sem MX — tenta A/AAAA (RFC permite entrega ao próprio host)
        try:
            dns.resolver.resolve(domain, 'A')
            result = True
        except dns.exception.DNSException:
            result = False
    except dns.resolver.NXDOMAIN:
        result = False  # domínio não existe
    except dns.exception.DNSException:
        result = True   # timeout/erro de rede → fail-open

    _mx_cache[domain] = result
    return result


def is_email_deliverable(email: str) -> bool:
    """Valida formato e se o domínio existe e aceita e-mails."""
    if not email:
        return False
    m = _EMAIL_RE.match(email.strip())
    if not m:
        return False
    return _domain_accepts_mail(m.group(1).lower())
