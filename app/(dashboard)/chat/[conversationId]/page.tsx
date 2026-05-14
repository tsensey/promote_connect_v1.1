import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ conversationId: string }>;
}

/**
 * /chat/[conversationId] → redirect to the unified chat page
 * with the conversation pre-selected via query param.
 */
export default async function ConversationRedirectPage({ params }: Props) {
  const { conversationId } = await params;
  redirect(`/chat?conv=${conversationId}`);
}
