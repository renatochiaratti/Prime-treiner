self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", async () => {
  await self.registration.unregister();
  const clientsArr = await self.clients.matchAll({ type: "window" });
  clientsArr.forEach((client) => client.navigate(client.url));
});
