  const permissions = {
  admin: [
    "create_venue",
    "edit_venue",
    "delete_venue",
    "book_ticket",
    "cancel_ticket",
    ""
  ],
  venue_owner : [
    "create_venue",
    "create_seat" ,
    "edit_venue",
    "delete_venue"
  ],
  organizer: [
    "create_venue",
    "edit_venue",
    "book_ticket"
  ],
  user: [
    "book_ticket",
    "cancel_ticket"
  ]
};
export  {permissions};