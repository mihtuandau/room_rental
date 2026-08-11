-- Keep the oldest cover when repairing legacy duplicate data before adding
-- the constraint that protects concurrent cover updates.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY room_id
           ORDER BY created_at ASC, id ASC
         ) AS rank
  FROM room_images
  WHERE is_cover = true
)
UPDATE room_images
SET is_cover = false
WHERE id IN (SELECT id FROM ranked WHERE rank > 1);

CREATE UNIQUE INDEX "room_one_cover_idx"
ON "room_images"("room_id")
WHERE "is_cover" = true;
