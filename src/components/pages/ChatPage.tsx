import HeaderBar from "../HeaderBar";
import PagePlaceholder from "../PagePlaceholder";

function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <HeaderBar title="Chat IA" />
      <PagePlaceholder
        title="Chat IA"
        icon="smart_toy"
        description="Pronto podrás conversar con un asistente inteligente para ajustar tu plan y resolver dudas en tiempo real."
      />
    </div>
  );
}

export default ChatPage;
