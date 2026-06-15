import { useState } from 'react';
import type { ProjectData, RequirementData } from '../../services/api';
import { type View, type TopicSelection, type TopicInfo } from '../../utils/constants';
import TelaProjetos from '../shared/TelaProjetos';
import TelaItens from '../shared/TelaItens';
import ValidacaoRequisitos from '../shared/ValidacaoRequisitos';
import Auditoria from '../shared/Auditoria';
import DownloadERS from '../shared/DownloadERS';
import { useAuth } from '../../contexts/AuthContext';

export default function ClienteProjetos() {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [view, setView] = useState<View>('projetos');
  const [topicSelection, setTopicSelection] = useState<TopicSelection | null>(null);

  const handleProjectSelect = (project: ProjectData) => {
    setSelectedProject(project);
    setView('itens');
  };

  const handleBack = () => {
    if (view === 'itens') {
      setSelectedProject(null);
      setTopicSelection(null);
      setView('projetos');
    } else if (view === 'validacao' || view === 'download' || view === 'auditoria') {
      setView('itens');
    }
  };

  const handleTopicSelect = (topic: TopicInfo, requirements: RequirementData[]) => {
    setTopicSelection({ topic, requirements });
    setView('validacao');
  };

  const handleDownload = () => {
    setView('download');
  };

  const handleAuditPage = () => {
    setView('auditoria');
  };

  if (selectedProject && view === 'itens') {
    return (
      <TelaItens
        project={selectedProject}
        onBack={handleBack}
        perfil="cliente"
        onTopicSelect={handleTopicSelect}
        onDownload={handleDownload}
        onAuditPage={handleAuditPage}
      />
    );
  }

  if (selectedProject && view === 'validacao' && topicSelection) {
    return (
      <ValidacaoRequisitos
        project={selectedProject}
        topic={{ ...topicSelection.topic, requirements: topicSelection.requirements }}
        onBack={handleBack}
        perfil="cliente"
        currentUser={user ? { id: user.id, nome: user.nome } : undefined}
      />
    );
  }

  if (selectedProject && view === 'download') {
    return (
      <DownloadERS
        project={selectedProject}
        requirements={topicSelection?.requirements || []}
        onBack={handleBack}
        perfil="cliente"
      />
    );
  }

  if (view === 'auditoria') {
    return <Auditoria perfil="cliente" onBack={handleBack} />;
  }

  return (
    <TelaProjetos
      perfil="cliente"
      topbarTitle="Painel do Cliente"
      topbarSubtitle="Acompanhe projetos e requisitos."
      onProjectSelect={handleProjectSelect}
      auditoriaContent={<Auditoria perfil="cliente" />}
    />
  );
}
