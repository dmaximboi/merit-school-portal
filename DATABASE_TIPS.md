# Supabase Free Tier Management Tips

Since you are using the Supabase free tier (500MB database limit), here are some strategies to manage your resources effectively:

## 1. Monitor Database Size
- Check your database size periodically in the Supabase Dashboard > Database > Usage.
- Text and JSONB fields can grow quickly.

## 2. Optimize Storage
### Chat Messages
- Chat messages can accumulate fast. Consider implementing a cleanup policy for old messages if they are not critical.
- **Action:** You might want to run a cron job or scheduled SQL query to delete chat messages older than 3 months.
  ```sql
  DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '3 months';
  ```

### Image Uploads
- We have implemented a **50KB limit** for image uploads in chat. This is crucial for saving storage space.
- Compressed images are stored as Base64/URLs. If storing binary data in DB, it consumes DB space. If using Storage Buckets, it consumes Storage bandwidth/size.
- **Recommendation:** Ensure you are using Supabase Storage buckets for large files, not putting base64 strings directly into the database text columns if possible. (Current implementation uses Cloudinary which is great - it offloads storage from your DB!)

### Logs
- The `security_logs` and `login_attempts` tables will grow over time.
- **Action:** Truncate old logs periodically.
  ```sql
  DELETE FROM security_logs WHERE created_at < NOW() - INTERVAL '1 month';
  ```

## 3. Performance
- **Indexes:** We have added indexes for performance. While they speed up queries, they also take up disk space. Only keep indexes that are actually used.
- **Vacuuming:** PostgreSQL usually auto-vacuums, but if you do heavy deletes, you might need to check if space is being reclaimed.

## 4. Backups
- The free tier provides Point-in-Time Recovery (PITR) for a limited window (usually 1 day or none depending on plan specifics).
- **Recommendation:** Periodically export your critical data (students, payments) to CSV/JSON as a manual backup.

## 5. Cost Avoidance
- **Cloudinary:** You are using Cloudinary for images. This is excellent for the free tier as it keeps heavy media out of your Supabase database limit.
- **Strict Limits:** The 50KB limit we added ensures that even if users spam images, they are small and efficient.
