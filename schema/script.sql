
-- Users
CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	account_id INTEGER,
	reputation INTEGER NOT NULL,
	views INTEGER DEFAULT 0,
	down_votes INTEGER DEFAULT 0,
	up_votes INTEGER DEFAULT 0,
	display_name VARCHAR(255) NOT NULL,
	location VARCHAR(512),
	profile_image_url VARCHAR(255),
	website_url VARCHAR(255),
	about_me TEXT,
	creation_date TIMESTAMP NOT NULL,
	last_access_date TIMESTAMP NOT NULL
);

-- Posts
CREATE TABLE posts (
	id SERIAL PRIMARY KEY,
	owner_user_id INTEGER,
	last_editor_user_id INTEGER,
	post_type_id SMALLINT NOT NULL,
	accepted_answer_id INTEGER,
	score INTEGER NOT NULL,
	parent_id INTEGER,
	view_count INTEGER,
	answer_count INTEGER DEFAULT 0,
	comment_count INTEGER DEFAULT 0,
	owner_display_name VARCHAR(64),
	last_editor_display_name VARCHAR(64),
	title VARCHAR(512),
	tags VARCHAR(512),
	content_license VARCHAR(64) NOT NULL,
	body TEXT,
	favorite_count INTEGER,
	creation_date TIMESTAMP NOT NULL,
	community_owned_date TIMESTAMP,
	closed_date TIMESTAMP,
	last_edit_date TIMESTAMP,
	last_activity_date TIMESTAMP
);

-- Votes
CREATE TABLE votes (
	id SERIAL PRIMARY KEY,
	user_id INTEGER,
	post_id INTEGER NOT NULL,
	vote_type_id SMALLINT NOT NULL,
	bounty_amount SMALLINT,
	creation_date TIMESTAMP NOT NULL
);

-- Tags
CREATE TABLE tags (
	id SERIAL PRIMARY KEY,
	excerpt_post_id INTEGER,
	wiki_post_id INTEGER,
	tag_name VARCHAR(255) NOT NULL,
	count INTEGER DEFAULT 0
);

\copy votes FROM '<csv file path without header>' DELIMITER ',' CSV
\copy tags FROM '<csv file path without header>' DELIMITER ',' CSV
\copy posts FROM '<csv file path without header>' DELIMITER ',' CSV
\copy users FROM '<csv file path without header>' DELIMITER ',' CSV

ALTER TABLE users DROP COLUMN website_url;
ALTER TABLE users DROP COLUMN last_access_date;
ALTER TABLE users ADD COLUMN passsword VARCHAR(350) DEFAULT 'user123';
ALTER TABLE users ADD COLUMN username VARCHAR(300);

UPDATE users 
SET username = display_name || '#' || id;


-- triggers 

CREATE OR REPLACE FUNCTION create_username() RETURNS trigger AS $create_username$

BEGIN

    UPDATE users 
    SET username = display_name || '#' || id
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$create_username$ LANGUAGE plpgsql;


CREATE OR REPLACE TRIGGER add_username
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_username();


CREATE OR REPLACE FUNCTION getPosts(tagsList text[]) RETURNS TABLE (id INTEGER,
	owner_user_id INTEGER,
	last_editor_user_id INTEGER,
	post_type_id SMALLINT,
	accepted_answer_id INTEGER,
	score INTEGER,
	parent_id INTEGER,
	view_count INTEGER,
	answer_count INTEGER,
	comment_count INTEGER,
	owner_display_name VARCHAR(64),
	last_editor_display_name VARCHAR(64),
	title VARCHAR(512),
	tags VARCHAR(512),
	content_license VARCHAR(64),
	body TEXT,
	favorite_count INTEGER,
	creation_date TIMESTAMP,
	community_owned_date TIMESTAMP,
	closed_date TIMESTAMP,
	last_edit_date TIMESTAMP,
	last_activity_date TIMESTAMP) AS $printStrings$  
DECLARE  
   tag_num integer := array_length(tagsList, 1);  
   i integer := 2;  
BEGIN 

    DROP TABLE IF EXISTS tag_temp;
    CREATE TEMP TABLE tag_temp(id INTEGER,
	owner_user_id INTEGER,
	last_editor_user_id INTEGER,
	post_type_id SMALLINT,
	accepted_answer_id INTEGER,
	score INTEGER,
	parent_id INTEGER,
	view_count INTEGER,
	answer_count INTEGER,
	comment_count INTEGER,
	owner_display_name VARCHAR(64),
	last_editor_display_name VARCHAR(64),
	title VARCHAR(512),
	tags VARCHAR(512),
	content_license VARCHAR(64),
	body TEXT,
	favorite_count INTEGER,
	creation_date TIMESTAMP,
	community_owned_date TIMESTAMP,
	closed_date TIMESTAMP,
	last_edit_date TIMESTAMP,
	last_activity_date TIMESTAMP);

      DROP TABLE IF EXISTS temporary;
    CREATE TEMP TABLE temporary(id INTEGER,
	owner_user_id INTEGER,
	last_editor_user_id INTEGER,
	post_type_id SMALLINT,
	accepted_answer_id INTEGER,
	score INTEGER,
	parent_id INTEGER,
	view_count INTEGER,
	answer_count INTEGER,
	comment_count INTEGER,
	owner_display_name VARCHAR(64),
	last_editor_display_name VARCHAR(64),
	title VARCHAR(512),
	tags VARCHAR(512),
	content_license VARCHAR(64),
	body TEXT,
	favorite_count INTEGER,
	creation_date TIMESTAMP,
	community_owned_date TIMESTAMP,
	closed_date TIMESTAMP,
	last_edit_date TIMESTAMP,
	last_activity_date TIMESTAMP);
    
    --Atleast one tag exists

    INSERT INTO temporary (SELECT * FROM posts where posts.tags LIKE  '%<'||tagsList[1]||'>%');
    INSERT INTO tag_temp (SELECT * FROM temporary);
    DELETE FROM temporary;
   WHILE i <= tag_num LOOP  
      INSERT INTO temporary ((SELECT * from tag_temp) INTERSECT (SELECT * FROM posts WHERE posts.tags LIKE  '%<'||tagsList[i]||'>%')) ;
      DELETE FROM tag_temp;
      INSERT INTO tag_temp (SELECT * FROM temporary);
      DELETE FROM temporary;
      i = i + 1;
   END LOOP; 
   RETURN QUERY SELECT * FROM tag_temp; 
END;  
$printStrings$ LANGUAGE plpgsql; 




