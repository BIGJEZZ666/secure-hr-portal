ALTER TABLE tb_employee
  ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) DEFAULT NULL
    COMMENT 'AES-GCM encrypted TOTP secret',
  ADD COLUMN IF NOT EXISTS two_factor_pending_secret VARCHAR(255) DEFAULT NULL
    COMMENT 'Encrypted pending TOTP secret';

UPDATE tb_employee
SET two_factor_enabled = 0
WHERE two_factor_enabled = 1
  AND two_factor_secret IS NULL;
