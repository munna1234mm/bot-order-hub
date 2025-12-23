export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  telegramUsername: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  shippingAddress: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'TG-001',
    customerName: 'Alex Johnson',
    telegramUsername: '@alexj',
    items: [
      { id: '1', name: 'Premium Widget', quantity: 2, price: 49.99 },
      { id: '2', name: 'Basic Gadget', quantity: 1, price: 29.99 },
    ],
    total: 129.97,
    status: 'pending',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    shippingAddress: '123 Main St, New York, NY 10001',
    notes: 'Please deliver before 5 PM',
  },
  {
    id: '2',
    orderNumber: 'TG-002',
    customerName: 'Maria Garcia',
    telegramUsername: '@mariag',
    items: [
      { id: '3', name: 'Deluxe Package', quantity: 1, price: 199.99 },
    ],
    total: 199.99,
    status: 'processing',
    createdAt: new Date('2024-01-14T15:45:00'),
    updatedAt: new Date('2024-01-15T09:00:00'),
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
  },
  {
    id: '3',
    orderNumber: 'TG-003',
    customerName: 'John Smith',
    telegramUsername: '@johns',
    items: [
      { id: '4', name: 'Standard Item', quantity: 3, price: 15.99 },
      { id: '5', name: 'Premium Add-on', quantity: 2, price: 24.99 },
    ],
    total: 97.95,
    status: 'shipped',
    createdAt: new Date('2024-01-13T08:20:00'),
    updatedAt: new Date('2024-01-14T16:30:00'),
    shippingAddress: '789 Pine Rd, Chicago, IL 60601',
  },
  {
    id: '4',
    orderNumber: 'TG-004',
    customerName: 'Emma Wilson',
    telegramUsername: '@emmaw',
    items: [
      { id: '6', name: 'Exclusive Bundle', quantity: 1, price: 349.99 },
    ],
    total: 349.99,
    status: 'delivered',
    createdAt: new Date('2024-01-10T12:00:00'),
    updatedAt: new Date('2024-01-12T14:00:00'),
    shippingAddress: '321 Elm St, Houston, TX 77001',
  },
  {
    id: '5',
    orderNumber: 'TG-005',
    customerName: 'Michael Brown',
    telegramUsername: '@mikeb',
    items: [
      { id: '7', name: 'Basic Widget', quantity: 5, price: 9.99 },
    ],
    total: 49.95,
    status: 'cancelled',
    createdAt: new Date('2024-01-12T09:15:00'),
    updatedAt: new Date('2024-01-12T11:30:00'),
    shippingAddress: '654 Maple Dr, Phoenix, AZ 85001',
    notes: 'Customer requested cancellation',
  },
  {
    id: '6',
    orderNumber: 'TG-006',
    customerName: 'Sarah Davis',
    telegramUsername: '@sarahd',
    items: [
      { id: '8', name: 'Pro Package', quantity: 1, price: 149.99 },
      { id: '9', name: 'Accessory Kit', quantity: 1, price: 39.99 },
    ],
    total: 189.98,
    status: 'pending',
    createdAt: new Date('2024-01-15T14:20:00'),
    updatedAt: new Date('2024-01-15T14:20:00'),
    shippingAddress: '987 Cedar Ln, Philadelphia, PA 19101',
  },
  {
    id: '7',
    orderNumber: 'TG-007',
    customerName: 'David Lee',
    telegramUsername: '@davidl',
    items: [
      { id: '10', name: 'Ultimate Edition', quantity: 1, price: 499.99 },
    ],
    total: 499.99,
    status: 'processing',
    createdAt: new Date('2024-01-14T11:00:00'),
    updatedAt: new Date('2024-01-15T08:45:00'),
    shippingAddress: '147 Birch Way, San Antonio, TX 78201',
  },
  {
    id: '8',
    orderNumber: 'TG-008',
    customerName: 'Lisa Anderson',
    telegramUsername: '@lisaa',
    items: [
      { id: '11', name: 'Starter Pack', quantity: 2, price: 29.99 },
    ],
    total: 59.98,
    status: 'shipped',
    createdAt: new Date('2024-01-11T16:30:00'),
    updatedAt: new Date('2024-01-13T10:15:00'),
    shippingAddress: '258 Walnut Blvd, San Diego, CA 92101',
  },
];

export const getOrderStats = () => {
  const totalOrders = mockOrders.length;
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length;
  const processingOrders = mockOrders.filter(o => o.status === 'processing').length;
  const completedOrders = mockOrders.filter(o => o.status === 'delivered').length;
  const totalRevenue = mockOrders.reduce((sum, o) => sum + o.total, 0);
  
  return {
    totalOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    totalRevenue,
  };
};
