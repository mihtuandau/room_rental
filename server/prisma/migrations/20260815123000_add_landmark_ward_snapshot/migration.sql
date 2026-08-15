-- Keep the current ward/commune snapshot alongside its normalized code.
ALTER TABLE "landmarks"
  ADD COLUMN "ward" TEXT;
