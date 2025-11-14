export const getUsers = () => {
  const users = localStorage.getItem('dating_app_users');
  return users ? JSON.parse(users) : [];
};

export const saveUser = (user) => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.email === user.email);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem('dating_app_users', JSON.stringify(users));
};

export const getChats = () => {
  const chats = localStorage.getItem('dating_app_chats');
  return chats ? JSON.parse(chats) : [];
};

export const saveChat = (chat) => {
  const chats = getChats();
  const existingIndex = chats.findIndex(c => c.id === chat.id);
  
  if (existingIndex >= 0) {
    chats[existingIndex] = chat;
  } else {
    chats.push(chat);
  }
  
  localStorage.setItem('dating_app_chats', JSON.stringify(chats));
};

// FUNCIONES DE MATCHES ELIMINADAS - YA NO SE USAN
// El sistema funciona con likes directos, no matches

export const getReports = () => {
  const reports = localStorage.getItem('dating_app_reports');
  return reports ? JSON.parse(reports) : [];
};

export const saveReport = (report) => {
  const reports = getReports();
  reports.push({
    ...report,
    id: Date.now(),
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('dating_app_reports', JSON.stringify(reports));
};
