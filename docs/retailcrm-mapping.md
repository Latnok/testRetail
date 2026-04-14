# RetailCRM Order Mapping

## Input mock shape

`mock_orders.json` contains an array of 50 orders with fields:

- `firstName`
- `lastName`
- `phone`
- `email`
- `orderType`
- `orderMethod`
- `status`
- `items[]`
- `delivery.address.city`
- `delivery.address.text`
- `customFields.utm_source`

`items[]` contains:

- `productName`
- `quantity`
- `initialPrice`

## Internal order model

- Customer: `firstName`, `lastName`, `phone`, `email`
- Order metadata: `orderType`, `orderMethod`, `status`
- Delivery: `delivery.address.city`, `delivery.address.text`
- Items: `productName`, `quantity`, `initialPrice`
- Custom fields: `utm_source`
- Calculated field: `totalSumm`

## RetailCRM API mapping

The importer sends orders to `POST /api/v5/orders/create` as `application/x-www-form-urlencoded`.
If needed, it also sends the `site` parameter.

- `order.firstName` <- `firstName`
- `order.lastName` <- `lastName`
- `order.phone` <- `phone`
- `order.email` <- `email`
- `order.orderType` <- `orderType`
- `order.orderMethod` <- `orderMethod`
- `order.status` <- `status`
- `order.items[]` <- `items[]`
- `order.delivery.address.city` <- `delivery.address.city`
- `order.delivery.address.text` <- `delivery.address.text`
- `order.customFields.utm_source` <- `customFields.utm_source`
- `order.totalSumm` <- sum of `quantity * initialPrice`

## Preconditions in RetailCRM

Before import, the CRM instance should contain matching references for:

- order type values used in mock data;
- order method values used in mock data;
- status values used in mock data;
- custom field `utm_source`, if strict validation is enabled.

## API rate limit

The shared RetailCRM client uses centralized throttling with a minimum `110ms` gap between requests. This keeps the integration below the RetailCRM limit of 10 requests per second from one IP.
