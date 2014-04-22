
create table users (
    name         varchar(15) NOT NULL,
    password     varchar(15) NOT NULL,
    email        varchar(254) PRIMARY KEY,
    created_at   timestamp NOT NULL,
    mongo_id     char(24) NOT NULL
);
