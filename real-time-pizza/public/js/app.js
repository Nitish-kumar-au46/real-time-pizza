// import Noty from "noty";
// const Noty = require("noty");
// import { initAdmin } from "./admin";

const addToCart = document.querySelectorAll(".add-to-cart");

let cartCounter = document.querySelector("#cartCounter");

async function updateCart(pizza) {
  await axios
    .post("/update-cart", pizza)
    .then((res) => {
      cartCounter.innerText = res.data.totalQty;
      new Noty({
        type: "Success",
        timeout: 1000,
        text: "Item added to cart",
        progressBar: false,
      }).show();
    })
    .catch((err) => {
      new Noty({
        type: "Error",
        timeout: 1000,
        text: "Somthing went wrong",
        progressBar: false,
      }).show();
    });
}

addToCart.forEach((button) => {
  button.addEventListener("click", (e) => {
    let pizza = JSON.parse(button.dataset.pizza);
    updateCart(pizza);
  });
});

// remoing alert message
const alertMessage = document.querySelector("#success-alert");
if (alertMessage) {
  setTimeout(() => {
    alertMessage.remove();
  }, 2000);
}

// admin related function call

function initAdmin(socket) {
  const orderTableBody = document.querySelector("#orderTableBody");
  let orders = [];

  let markup;

  axios
    .get("/admin/orders", {
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
    .then((res) => {
      orders = res.data;
      markup = generateMarkup(orders);
      orderTableBody.innerHTML = markup;
    })
    .catch((err) => {
      console.log(err);
    });

  function renderItems(items) {
    let parsedItems = Object.values(items);
    return parsedItems
      .map((menuItem) => {
        return `
    <p>${menuItem.item.name} - ${menuItem.qty} pcs </p>
    `;
      })
      .join("");
  }

  function generateMarkup(orders) {
    return orders
      .map((order) => {
        return `
        
        <tr>
<td class="border px-4 py-2 text-green-900">
      <p>${order._id}</p>
      <div>${renderItems(order.items)}</div>
</td>
<td class="border px-4 py-2 ">${order.customerId.name}</td>
<td class="border px-4 py-2 ">${order.address}</td>
<td class="border px-4 py-2 ">
      <div class="inline-block relative w-64">
            <form action="/admin/order/status" method="POST">
            <input type="hidden" name="orderId" value="${order._id}" />
            <select name="status" onchange="this.form.submit()" class="block 
            appearance-none w-full bg-gray-500 text-white border border-gray-500 
            hover:border-gray-700 px-4 py-2 pr-8 rounded shadow leading-tight 
            focus:outline-none  focus:shadow-outline">
      <option value ="order_placed" 
      ${order.status === "order_placed" ? "selected" : ""}>Placed</option>
       <option value="confirmed" ${
         order.status === "confirmed" ? "selected" : ""
       }>Confirmed</option>
<option value="prepared" ${
          order.status === "prepared" ? "selected" : ""
        }>Prepared</option>
<option value="delivered" ${
          order.status === "delivered" ? "selected" : ""
        }>Delivered</option>
<option value="completed" ${
          order.status === "completed" ? "selected" : ""
        }>Completed</option>
      </select>

            </form>
<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">


</div>
            </div>
</td>
<td class="border px-4 py-2 ">
${moment(order.createdAt).format("hh:mm A")}
</td>

</tr>
 `;
      })
      .join("");
  }

  socket.on("orderPlaced", (order) => {
    orders.unshift(order);
    orderTableBody.innerHTML = "";
    orderTableBody.innerHTML = generateMarkup(orders);
  });
}

// change order status

let statusCompleted = document.querySelectorAll(".status_line");
let hiddenInput = document.querySelector("#hiddenInput");
let order = hiddenInput ? hiddenInput.value : null;
order = JSON.parse(order);
let time = document.createElement("small");

function updateStatus(order) {
  statusCompleted.forEach((status) => {
    status.classList.remove("step-completed");
    status.classList.remove("current");
  });

  let stepCompleted = true;
  statusCompleted.forEach((status) => {
    let dataProperty = status.dataset.status;
    if (stepCompleted) {
      status.classList.add("step-completed");
    }
    if (dataProperty === order.status) {
      stepCompleted = false;
      time.innerText = moment(order.updatedAt).format("hh:mm A");
      status.appendChild(time);
      if (status.nextElementSibling) {
        status.nextElementSibling.classList.add("current");
      }
    }
  });
}

updateStatus(order);

// Socket working code is here

let socket = io();

if (order) {
  socket.emit("join", `order_${order._id}`);
}

let adminAreaPath = window.location.pathname;
// console.log(adminAreaPath);
if (adminAreaPath.includes("admin")) {
  initAdmin(socket);

  socket.emit("join", "adminRoom");
}

socket.on("orderUpdated", (data) => {
  const updatedOrder = { ...order };
  updatedOrder.updatedAt = moment().format();
  updatedOrder.status = data.status;
  updateStatus(updatedOrder);
  console.log(data);
});
