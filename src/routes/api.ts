import { Router } from "express";
import type { Dependencies } from "../dependencies.ts";
import { getCurrentSession } from "../auth/sessions.ts";
import {
  findOrderById,
  listAllOrders,
  listOrderItems,
  listOrdersForUser,
  type Order,
  type OrderItem,
} from "../orders/index.ts";
import { listProducts, type Product } from "../products.ts";
import { findApiKey } from "../auth/apiKeys.ts";

export function createApiRouter(deps: Dependencies): Router {
  const { db } = deps;
  const router = Router();

  router.get("/api/account/orders", (req, res) => {
    const current = getCurrentSession(db, req.header("cookie"));
    if (!current) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const orders = listOrdersForUser(db, current.user.id).map(toOrderResponse);


    res.json({ orders });
  });

  router.get("/api/orders/:id", (req, res) => {
    const current = getCurrentSession(db, req.header("cookie"));
    const orderId = Number(req.params.id);
    const order = findOrderById(db, orderId);
    if (!current) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!Number.isSafeInteger(orderId)) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.user_id !== current.user.id) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

    res.json({ order: toOrderResponse(order), items: listOrderItems(db, order.id).map(toOrderItemResponse) });
  });

  router.get("/api/products", (_req, res) => {
    const products = listProducts(db).map(toProductResponse);
    res.json({ products });
  });

  router.get("/api/integrations/warehouse/orders", (_req, res) => {

    const apiKey = findApiKey(db, _req.header("x-api-key") ?? "");
    if (!apiKey) {
      res.status(401).json({ error: "Missing API key" });
      return;
    } else if (
      apiKey.scope !=="orders:read") {
        res.status(403).json({ error: "API key does not have read access" });
        return;
      }

    const orders = listAllOrders(db).map(toOrderResponse);

    res.json({
      integration: "Warehouse Fulfillment Integration",
      orders,
    });
  });
  
  return router;
}

type ProductResponse = {
  id: number;
  name: string;
  description: string;
  image_path: string;
  price_cents: number;
};

function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    image_path: product.image_path,
    price_cents: product.price_cents,
  };
}

type OrderResponse = {
  id: number;
  status: Order["status"];
  total_cents: number;
  created_at: string;
};

function toOrderResponse(order: Order): OrderResponse {
  return {
    id: order.id,
    status: order.status,
    total_cents: order.total_cents,
    created_at: order.created_at,
  };
}

type OrderItemResponse = {
  product_id: number;
  product_name: string;
  quantity: number;
  price_cents: number;
};

function toOrderItemResponse(item: OrderItem): OrderItemResponse {
  return {
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    price_cents: item.price_cents,
  };
}