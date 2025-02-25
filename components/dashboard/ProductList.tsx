"use client";

import Image from "next/image";
import Link from "next/link";
import { ProductQuantityControl } from "./ProductQuantityControl";
import { Pencil, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  updatedAt: Date;
}

interface ProductListProps {
  products: Product[];
  onQuantityChange: (productId: string, quantity: number) => void;
}

export function ProductList({ products, onQuantityChange }: ProductListProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Product</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Updated At</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center space-x-4">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium">{product.name}</span>
                </div>
              </TableCell>
              <TableCell>{formatPrice(product.price)}</TableCell>
              <TableCell>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <ProductQuantityControl
                    quantity={product.quantity}
                    onChange={(newQuantity) => onQuantityChange(product.id, newQuantity)}
                  />
                </div>
              </TableCell>
              <TableCell>
                <Link href={`/product/${product.id}/edit`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit product</span>
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
