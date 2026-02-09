const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyCascade() {
  const client = await pool.connect();
  try {
    console.log('Applying cascading deletion to audit logs...');

    await client.query('BEGIN');

    // 1. Audit Logs (user_id)
    console.log('Updating audit_logs constraints...');
    // Drop existing constraint (assuming default name given by Postgres or schema)
    // We need to find the constraint name first or just assume standard naming conventions but safe to drop by column if we knew the name. 
    // Since names can vary, let's try to drop the constraint by name if Known, otherwise we might need to look it up.
    // However, schema.sql didn't specify names, so Postgres generated them.
    // Let's look up the constraint name for audit_logs user_id
    
    const getAuditLogConstraint = await client.query(`
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'audit_logs'::regclass AND confrelid = 'users'::regclass
    `);
    
    if (getAuditLogConstraint.rows.length > 0) {
        const constraintName = getAuditLogConstraint.rows[0].conname;
        console.log(`Found audit_logs constraint: ${constraintName}`);
        await client.query(`ALTER TABLE audit_logs DROP CONSTRAINT ${constraintName}`);
        await client.query(`
            ALTER TABLE audit_logs 
            ADD CONSTRAINT audit_logs_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `);
    } else {
        console.log('No foreign key found for audit_logs user_id, adding new one.');
        // Potentially table doesn't have it or something else. But let's try adding.
        await client.query(`
            ALTER TABLE audit_logs 
            ADD CONSTRAINT audit_logs_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `);
    }

    // 2. Admin Audit Logs (admin_user_id)
    console.log('Updating admin_audit_logs constraints...');
    const getAdminAuditLogConstraint = await client.query(`
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'admin_audit_logs'::regclass AND confrelid = 'users'::regclass
    `);

    if (getAdminAuditLogConstraint.rows.length > 0) {
        const constraintName = getAdminAuditLogConstraint.rows[0].conname;
        console.log(`Found admin_audit_logs constraint: ${constraintName}`);
        await client.query(`ALTER TABLE admin_audit_logs DROP CONSTRAINT ${constraintName}`);
        await client.query(`
            ALTER TABLE admin_audit_logs 
            ADD CONSTRAINT admin_audit_logs_admin_user_id_fkey 
            FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
        `);
    } else {
        console.log('No foreign key found for admin_audit_logs admin_user_id, adding new one.');
        await client.query(`
            ALTER TABLE admin_audit_logs 
            ADD CONSTRAINT admin_audit_logs_admin_user_id_fkey 
            FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
        `);
    }

    await client.query('COMMIT');
    console.log('✅ Successfully applied cascading deletion!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration Failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

applyCascade();
