import { useNavigate } from 'react-router-dom';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatComposer } from '../../components/chat/ChatComposer';
import { ChatMessagesPane } from '../../components/chat/ChatMessagesPane';
import { ImagePreviewDialog } from '../../components/chat/ImagePreviewDialog';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { useDashboardChatConversation } from '../../hooks/chat/useDashboardChatConversation';

export const DashboardChatPage = () => {
  useViewportHeight();
  const navigate = useNavigate();
  const {
    user,
    peer,
    draft,
    messages,
    pendingAttachment,
    isUploadingAttachment,
    isLoadingConversation,
    errorMessage,
    isSocketReady,
    downloadingMessageId,
    isPeerTyping,
    previewImage,
    peerAvatarUrl,
    isPeerOnline,
    messagesEndRef,
    setDraft,
    setPreviewImage,
    sendMessage,
    stopTyping,
    handleFileSelection,
    removePendingAttachment,
    handlePdfDownload
  } = useDashboardChatConversation();

  return (
    <section className="flex min-h-0 flex-col overflow-hidden bg-dark-bg" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <ChatHeader
        isLoading={isLoadingConversation}
        avatarUrl={peerAvatarUrl}
        avatarAlt={`${peer?.fullName ?? 'Chat partner'} avatar`}
        title={peer?.fullName ?? 'Chat'}
        isOnline={isPeerOnline}
        showAvatarBorder={false}
        showBackButton
        onBackButtonClick={() => navigate(user?.role === 'ADMIN' ? '/admin/dashboard/chat' : '/dashboard/chat')}
      />

      <ChatMessagesPane
        messages={messages}
        userId={user?.id}
        userRole={user?.role}
        peer={peer}
        peerAvatarUrl={peerAvatarUrl}
        isLoadingConversation={isLoadingConversation}
        errorMessage={errorMessage}
        isPeerTyping={isPeerTyping}
        downloadingMessageId={downloadingMessageId}
        messagesEndRef={messagesEndRef}
        onPdfDownload={handlePdfDownload}
        onPreviewImage={setPreviewImage}
      />

      <ChatComposer
        draft={draft}
        setDraft={setDraft}
        pendingAttachment={pendingAttachment}
        isUploadingAttachment={isUploadingAttachment}
        isSocketReady={isSocketReady}
        hasPeer={Boolean(peer)}
        onSubmit={sendMessage}
        onDraftBlur={stopTyping}
        onFileSelection={handleFileSelection}
        onRemoveAttachment={removePendingAttachment}
      />

      <ImagePreviewDialog image={previewImage} onClose={() => setPreviewImage(null)} />
    </section>
  );
};
