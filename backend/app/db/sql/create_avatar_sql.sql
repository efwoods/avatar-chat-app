INSERT INTO avatars (user_id, name, description)
VALUES ($1, $2, $3)
RETURNING id;
