'use client'

import {
  Utensils, ShoppingBag, Zap, Car, Film, Heart, BookOpen, PiggyBank,
  Briefcase, Laptop, TrendingUp, PlusCircle, MinusCircle, Circle,
  Coffee, Home, Plane, Dumbbell, Gift, Music, ShoppingCart, Fuel,
  Bus, Bike, Baby, Star, DollarSign, Wallet, CreditCard, Banknote,
  type LucideProps,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  zap: Zap,
  car: Car,
  film: Film,
  heart: Heart,
  'book-open': BookOpen,
  'piggy-bank': PiggyBank,
  briefcase: Briefcase,
  laptop: Laptop,
  'trending-up': TrendingUp,
  'plus-circle': PlusCircle,
  'minus-circle': MinusCircle,
  circle: Circle,
  coffee: Coffee,
  home: Home,
  plane: Plane,
  dumbbell: Dumbbell,
  gift: Gift,
  music: Music,
  'shopping-cart': ShoppingCart,
  fuel: Fuel,
  bus: Bus,
  bike: Bike,
  baby: Baby,
  star: Star,
  'dollar-sign': DollarSign,
  wallet: Wallet,
  'credit-card': CreditCard,
  banknote: Banknote,
}

interface CategoryIconProps extends LucideProps {
  name: string
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const Icon = iconMap[name] ?? Circle
  return <Icon {...props} />
}
