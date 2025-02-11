import React, { useState } from 'react';
import { Preview } from '@creatomate/preview';
import { Button } from './Button';  // Importa o novo componente Button
import VideoPopup from './VideoPopup';

interface CreateButtonProps {
  preview: Preview;
}

export const CreateButton: React.FC<CreateButtonProps> = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Função para iniciar o SSE
  const subscribeSSE = () => {
    const es = new EventSource('/api/video-sse');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('SSE mensagem recebida:', data);
        if (data.url) {
          setVideoUrl(data.url);
          setIsLoading(false);
          es.close();
          setEventSource(null);
        }
      } catch (error) {
        console.error('Erro no SSE:', error);
      }
    };
    setEventSource(es);
  };

  const handleCreate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    // Inicia o SSE para receber atualizações sobre o vídeo
    subscribeSSE();

    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: props.preview.getSource() }),
      });
      const data = await response.json();
      console.log('📤 Resposta da API:', data);
    } catch (error) {
      console.error('Erro ao criar vídeo:', error);
      setIsLoading(false);
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
    }
  };

  return (
    <div>
      <Button onClick={handleCreate} disabled={isLoading}>
        {isLoading ? 'Processando...' : 'Criar Vídeo'}
      </Button>

      {videoUrl && (
        <VideoPopup
          videoUrl={videoUrl}
          onClose={() => {
            setVideoUrl(null);
            if (eventSource) {
              eventSource.close();
              setEventSource(null);
            }
          }}
        />
      )}
    </div>
  );
};
