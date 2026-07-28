const { Client } = require("pg");

const password = "Le23/05//1996";
const user = "postgres.kdtfbnygmuilfgihivll";
const host = "aws-0-eu-west-1.pooler.supabase.com";

(async () => {
  for (const port of [6543, 5432]) {
    const client = new Client({
      host,
      port,
      user,
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    try {
      await client.connect();
      const r = await client.query("select current_database(), current_user");
      console.log("OK", port, r.rows[0]);
      await client.end();
    } catch (e) {
      console.log("FAIL", port, e.message);
      try {
        await client.end();
      } catch {}
    }
  }
})();
