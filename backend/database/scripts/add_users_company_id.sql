-- Run once in phpMyAdmin on database: fina_pos_sky
-- Fixes login error: Unknown column 'company_id' in 'SET'

ALTER TABLE `users`
  ADD COLUMN `company_id` BIGINT UNSIGNED NULL AFTER `role_id`;

ALTER TABLE `users`
  ADD CONSTRAINT `users_company_id_foreign`
  FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

-- Link existing users to their owned company (if any)
UPDATE `users` u
INNER JOIN `companies` c ON c.user_id = u.id
SET u.company_id = c.id
WHERE u.company_id IS NULL;
