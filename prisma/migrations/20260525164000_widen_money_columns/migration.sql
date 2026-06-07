-- Widen IDR money columns so multi-day event pricing does not overflow.
ALTER TABLE `venues`
    MODIFY `price_per_hour` DECIMAL(15, 2) NULL,
    MODIFY `price_per_day` DECIMAL(15, 2) NULL;

ALTER TABLE `events`
    MODIFY `base_price` DECIMAL(15, 2) NULL,
    MODIFY `additional_fees` DECIMAL(15, 2) NULL DEFAULT 0,
    MODIFY `final_price` DECIMAL(15, 2) NULL;
