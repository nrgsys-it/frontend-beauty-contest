/*
  Warnings:

  - Added the required column `message_sequence` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN  "message_sequence" INTEGER NOT NULL DEFAULT 0;
