/**
 * Demo users / admins seed data.
 *
 * Each entry: { name, email, password (plaintext, hashed at insert), role,
 *               access, status?, avatar?, phone? }
 *
 * Roles: SUPER_ADMIN | MANAGER | ACCOUNTANT | AGENT
 * Access: FULL_ACCESS | LIMITED_ADMIN | READ_ONLY
 */
module.exports = [
  // Super Admins
  { name: 'Lila Thompson',  email: 'admin@vantus.com',      password: 'admin123',      role: 'SUPER_ADMIN', access: 'FULL_ACCESS', avatar: 'https://i.pravatar.cc/120?img=47' },
  { name: 'Mia Johnson',    email: 'mia@vantus.com',        password: 'admin123',      role: 'SUPER_ADMIN', access: 'READ_ONLY',   avatar: 'https://i.pravatar.cc/120?img=49' },
  { name: 'Olivia Brown',   email: 'olivia@vantus.com',     password: 'admin123',      role: 'SUPER_ADMIN', access: 'FULL_ACCESS', status: 'DISABLED', avatar: 'https://i.pravatar.cc/120?img=44' },

  // Managers
  { name: 'Chloe Anderson', email: 'manager@vantus.com',    password: 'manager123',    role: 'MANAGER',     access: 'FULL_ACCESS',   avatar: 'https://i.pravatar.cc/120?img=32' },
  { name: 'Ella Robinson',  email: 'ella@vantus.com',       password: 'manager123',    role: 'MANAGER',     access: 'LIMITED_ADMIN', avatar: 'https://i.pravatar.cc/120?img=20' },
  { name: 'Grace Hall',     email: 'grace@vantus.com',      password: 'manager123',    role: 'MANAGER',     access: 'LIMITED_ADMIN', status: 'DISABLED', avatar: 'https://i.pravatar.cc/120?img=24' },

  // Accountants
  { name: 'Ava Martinez',   email: 'accountant@vantus.com', password: 'accountant123', role: 'ACCOUNTANT',  access: 'FULL_ACCESS', avatar: 'https://i.pravatar.cc/120?img=10' },
  { name: 'Isabella Garcia',email: 'isabella@vantus.com',   password: 'accountant123', role: 'ACCOUNTANT',  access: 'FULL_ACCESS', avatar: 'https://i.pravatar.cc/120?img=23' },
  { name: 'Sofia Lee',      email: 'sofia@vantus.com',      password: 'accountant123', role: 'ACCOUNTANT',  access: 'READ_ONLY', status: 'DISABLED', avatar: 'https://i.pravatar.cc/120?img=29' },

  // Agents
  { name: 'Ethan Brooks',   email: 'agent@vantus.com',      password: 'agent123',      role: 'AGENT',       access: 'FULL_ACCESS',   avatar: 'https://i.pravatar.cc/120?img=14' },
  { name: 'Jin Park',       email: 'jin@vantus.com',        password: 'agent123',      role: 'AGENT',       access: 'LIMITED_ADMIN', avatar: 'https://i.pravatar.cc/120?img=15' },
  { name: 'Tao Li',         email: 'tao@vantus.com',        password: 'agent123',      role: 'AGENT',       access: 'FULL_ACCESS', status: 'DISABLED', avatar: 'https://i.pravatar.cc/120?img=12' },
  { name: 'Sophie Klein',   email: 'sophie@vantus.com',     password: 'agent123',      role: 'AGENT',       access: 'FULL_ACCESS',   avatar: 'https://i.pravatar.cc/120?img=45' },
];
