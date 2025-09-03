Goal

Add phone, address, and emergency_contact fields to the User model, factory, and database schema.

Requirements checklist

- Add `phone`, `address`, and `emergency_contact` to `app/Models/User.php` fillable
- Update `database/factories/UserFactory.php` to provide fake values for the new fields
- Add a migration to add the columns to the `users` table
- Ensure nullable default to avoid breaking existing data

Assumptions

- Use nullable columns to avoid backfill complexity
- Simple string/text types suffice for phone/address/contact

Plan

1. Edit `User` model to include new fillable attributes
2. Update `UserFactory` to return fake values for the fields
3. Create a migration `2025_09_02_160000_add_contact_fields_to_users_table.php` to add nullable columns
4. Run migrations locally (developer)

Files to touch

- app/Models/User.php
- database/factories/UserFactory.php
- database/migrations/2025_09_02_160000_add_contact_fields_to_users_table.php

Validation plan

- Run `php artisan migrate` (or `php artisan migrate --path=database/migrations/2025_09_02_160000_add_contact_fields_to_users_table.php`)
- Run `composer test` or `php artisan test` to ensure no tests broke

Progress log

- 2025-09-02 16:00 - Updated model, factory, added migration and this plan file.

Done

- Edited User model fillable
- Edited UserFactory to include fake values
- Added migration to add fields (nullable)

Next steps

- Run migrations: `php artisan migrate`
- Optional: add validation rules, update controllers and API resources to return new fields

