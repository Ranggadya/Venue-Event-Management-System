-- AlterTable
ALTER TABLE `events` ADD COLUMN `additional_fees` DECIMAL(10, 2) NULL DEFAULT 0,
    ADD COLUMN `base_price` DECIMAL(10, 2) NULL,
    ADD COLUMN `discount` DECIMAL(5, 2) NULL DEFAULT 0,
    ADD COLUMN `final_price` DECIMAL(10, 2) NULL,
    ADD COLUMN `is_paid` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `payment_date` DATETIME(3) NULL,
    ADD COLUMN `rental_type` ENUM('HOURLY', 'DAILY') NOT NULL DEFAULT 'HOURLY';

-- CreateIndex
CREATE INDEX `events_is_paid_idx` ON `events`(`is_paid`);
