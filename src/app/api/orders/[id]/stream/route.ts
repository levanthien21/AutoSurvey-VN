import { NextRequest } from 'next/server';
import { orderManager } from '@/lib/orderStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const order = orderManager.getOrder(params.id);
  if (!order) {
    return new Response('Order not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial state immediately
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(order)}\n\n`));

      const unsubscribe = orderManager.subscribe(params.id, (updatedOrder) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(updatedOrder)}\n\n`));
          if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
            // Can stay open or close
          }
        } catch {
          unsubscribe();
        }
      });

      req.signal.addEventListener('abort', () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
