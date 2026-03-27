CREATE EXTENSION "uuid-ossp"

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  -- prevent the duplicate role
  
  PRIMARY KEY (user_id, role_id)
);
