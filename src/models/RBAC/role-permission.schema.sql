CREATE EXTENSION "uuid-ossp"

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  -- each pair will unique for the role doesnot same permission twises
  PRIMARY KEY (role_id, permission_id)
);

