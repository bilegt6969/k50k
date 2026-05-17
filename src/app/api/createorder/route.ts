//web/src/app/api/createorder/route.ts
import { NextResponse } from 'next/server';
import { getSanityWriteClient } from '@/lib/sanity-write'

// Your Discord Webhook URL from environment variables
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

// --- TypeScript Interfaces ---

interface ErrorWithMessage {
  message: string;
}

/**
 * Interface for a single item within an order.
 * The imageUrl is optional as some products might not have one.
 */
interface OrderItem {
  name: string;
  size: string;
  quantity: number;
  price: number;
  imageUrl?: string; // The image URL for the product
}

/**
 * Interface for the entire order data payload received from the frontend.
 */
interface OrderData {
  orderNumber: string;
  transferCode: string;
  customerName: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  address: string;
  paymentMethod: string;
  bankName: string;
  bankAccount?: string;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  commissionFee: number;
  orderStatus: string;
  items: OrderItem[];
}

// --- Helper Functions ---

/**
 * Type guard to check if an unknown error is an object with a message property.
 * @param error - The unknown value to check.
 * @returns True if the error has a message property, false otherwise.
 */
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Converts an unknown error type into an object with a message property.
 * @param maybeError - The potential error.
 * @returns An object with a message property.
 */
function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // Fallback in case stringifying the error fails
    return new Error(String(maybeError));
  }
}

/**
 * Formats a number into Mongolian Tugrik (₮) currency format.
 * @param amount - The number to format.
 * @returns A string representing the amount in currency format.
 */
const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString()}₮`;
}

// --- Debug GET Method ---
export async function GET() {
  return NextResponse.json({ 
    message: "CreateOrder API route is working",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    hasWebhook: !!process.env.DISCORD_WEBHOOK_URL
  });
}

// --- API Route Handler ---
export async function POST(request: Request) {
  // First, check if the webhook URL is configured.
  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not set in environment variables.");
    return NextResponse.json(
      {
        success: false,
        message: "Server configuration error: Notification service is unavailable.",
      },
      { status: 500 }
    );
  }
  

  try {
    const orderData: OrderData = await request.json();
    const sanityWrite = getSanityWriteClient()

    // --- Basic Validation ---
    if (!orderData.orderNumber || !orderData.transferCode) {
      return NextResponse.json(
        { success: false, message: 'Order number and transfer code are required' },
        { status: 400 }
      );
    }

    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    const sanityOrderDoc = {
      _id: `order-${orderData.orderNumber}`,
      _type: 'order',
      orderNumber: orderData.orderNumber,
      transferCode: orderData.transferCode,
      customerName: orderData.customerName,
      phone: orderData.phone,
      email: orderData.email,
      province: orderData.province,
      district: orderData.district,
      address: orderData.address,
      bankName: orderData.bankName,
      bankAccount: orderData.bankAccount ?? '',
      totalAmount: orderData.totalAmount,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      commissionFee: orderData.commissionFee,
      orderStatus: orderData.orderStatus,
      paymentMethod: orderData.paymentMethod,
      items: orderData.items.map((item) => ({
        _key: `${item.name}-${item.size}-${item.quantity}-${item.price}`.replace(/\s+/g, '-'),
        productId: '',
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: new Date().toISOString(),
    }

    // Upsert by deterministic id so retries remain safe in production.
    await sanityWrite.createOrReplace(sanityOrderDoc)

    // --- Discord Integration ---

    // 1. Format the order items into a readable string for the Discord embed.
    const itemsDescription = orderData.items.map((item: OrderItem) => {
      const itemTotal = formatCurrency(item.price * item.quantity);
      return `**${item.name}**\n- Хэмжээ: ${item.size}\n- Тоо: ${item.quantity}\n- Үнэ: ${itemTotal}`;
    }).join('\n\n');

    // 2. Get the image URL from the *first item* to use as a thumbnail.
    const firstItemImageUrl = orderData.items[0]?.imageUrl;

    // 3. Construct the rich embed payload for the Discord message.
    const discordPayload = {
      username: "Tsuifu Order Bot",
      avatar_url: "https://i.imgur.com/gA3v3cW.png", // A generic bot avatar
      embeds: [
        {
          title: `Шинэ захиалга: #${orderData.orderNumber}`,
          color: 3447003, // A nice blue color (#3498db)
          timestamp: new Date().toISOString(),
          // Add the thumbnail property if an image URL is available.
          thumbnail: firstItemImageUrl ? { url: firstItemImageUrl } : undefined,
          fields: [
            // Customer and Address Info
            {
              name: "👤 Хэрэглэгчийн мэдээлэл",
              value: `**Нэр:** ${orderData.customerName}\n**Утас:** ${orderData.phone}\n**И-мэйл:** ${orderData.email}`,
              inline: false,
            },
            {
              name: "🚚 Хүргэлтийн хаяг",
              value: `${orderData.province}, ${orderData.district}, ${orderData.address}`,
              inline: false,
            },
            // Divider for visual separation
            { name: '\u200B', value: '\u200B' },
            // Payment Info
            {
              name: "💳 Төлбөрийн мэдээлэл",
              value: `**Банк:** ${orderData.bankName}\n**Гүйлгээний утга:** \`${orderData.transferCode}\``,
              inline: true,
            },
            {
                name: "💰 Нийт дүн",
                value: `**${formatCurrency(orderData.totalAmount)}**`,
                inline: true,
            },
             // Divider
            { name: '\u200B', value: '\u200B' },
            // Items list
            {
              name: "🛒 Бараанууд",
              value: itemsDescription,
              inline: false,
            },
            // Order Summary
            {
              name: "📋 Дүн",
              value: `**Барааны дүн:** ${formatCurrency(orderData.subtotal)}\n**Хүргэлт:** ${formatCurrency(orderData.deliveryFee)}\n**Шимтгэл:** ${formatCurrency(orderData.commissionFee)}`,
              inline: false
            }
          ],
          footer: {
            text: `Захиалгын төлөв: ${orderData.orderStatus}`,
          },
        },
      ],
    };

    // 4. Send the data to your Discord webhook.
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    });

    // 5. Check if the webhook post was successful.
    if (!discordResponse.ok) {
      // Log the error for debugging but don't block the user's flow.
      console.error('Failed to send order to Discord:', discordResponse.status, await discordResponse.text());
    }

    // --- End of Discord Integration ---

    // Finally, return a success response to the frontend client.
    return NextResponse.json(
      {
        success: true,
        orderId: orderData.orderNumber,
        orderNumber: orderData.orderNumber
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating order:', error);
    const errorWithMessage = toErrorWithMessage(error);
    // Return a generic server error response.
    return NextResponse.json(
      {
        success: false,
        message: errorWithMessage.message
      },
      { status: 500 }
    );
  }
}