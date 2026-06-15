import { useState } from 'react';
import type { ProjectData, RequirementData } from '../../services/api';
import { type View, type TopicSelection, type TopicInfo } from '../../utils/constants';
import TelaProjetos from '../shared/TelaProjetos';
import TelaItens from '../shared/TelaItens';
import ValidacaoRequisitos from '../shared/ValidacaoRequisitos';
import Auditoria from '../shared/Auditoria';
import DownloadERS from '../shared/DownloadERS';
import { useAuth } from '../../contexts/AuthContext';

export default function DesenvolvedorProjetos() {
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
        perfil="desenvolvedor"
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
        perfil="desenvolvedor"
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
        perfil="desenvolvedor"
      />
    );
  }

  if (view === 'auditoria') {
    return <Auditoria perfil="desenvolvedor" onBack={handleBack} />;
  }

  return (
    <TelaProjetos
      perfil="desenvolvedor"
      topbarTitle="Painel do Desenvolvedor"
      topbarSubtitle="Acompanhe requisitos e validações."
      onProjectSelect={handleProjectSelect}
      onAuditoriaSidebarNav={() => setView('auditoria')}
    />
  );
}
