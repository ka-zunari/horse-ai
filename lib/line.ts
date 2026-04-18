type LineTextMessage = {
  type: "text";
  text: string;
};

export async function pushLineMessage(text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!token) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN が設定されていません。");
  }

  if (!userId) {
    throw new Error("LINE_USER_ID が設定されていません。");
  }

  const body = {
    to: userId,
    messages: [
      {
        type: "text",
        text
      } satisfies LineTextMessage
    ]
  };

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LINE push failed: ${response.status} ${errorText}`);
  }
}