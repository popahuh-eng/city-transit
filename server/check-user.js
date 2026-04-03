const { Client } = require('pg');

const run = async () => {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_lw41HkusxQth@ep-broad-tree-al39pavc-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    const res = await client.query("SELECT email FROM users WHERE email = 'popahuh@gmail.com'");
    console.log("Users found:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
};

run();
