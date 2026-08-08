-- ============================================================
-- CHIPELEC POWER SYSTEM
-- Migration: Add product_id to enquiries table
-- Run this on your MySQL database (Railway)
-- Safe: product_id is nullable, no existing rows are affected
-- ============================================================

ALTER TABLE enquiries
    ADD COLUMN product_id INT NULL DEFAULT NULL AFTER email,
    ADD CONSTRAINT fk_enquiry_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

-- Verify the change
DESCRIBE enquiries;
