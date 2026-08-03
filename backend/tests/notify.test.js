import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("../src/modules/shared/notification.model.js", () => ({
  default: { create: (...args) => createMock(...args) },
}));

const { notify } = await import("../src/utils/notify.js");

function mockApp(io) {
  return { get: (key) => (key === "io" ? io : undefined) };
}

describe("notify", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("persists a notification with the given fields", async () => {
    const fakeNotification = { _id: "n1", user: "u1", type: "system", title: "Hi", message: "", link: "" };
    createMock.mockResolvedValue(fakeNotification);

    const result = await notify(mockApp(null), { user: "u1", type: "system", title: "Hi" });

    expect(createMock).toHaveBeenCalledWith({ user: "u1", type: "system", title: "Hi", message: "", link: "" });
    expect(result).toBe(fakeNotification);
  });

  it("defaults message and link to empty strings when omitted", async () => {
    createMock.mockResolvedValue({});
    await notify(mockApp(null), { user: "u1", type: "system", title: "Hi" });
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ message: "", link: "" }));
  });

  it("emits a socket event to the recipient's room when Socket.io is registered on the app", async () => {
    const fakeNotification = { _id: "n2", user: "u2" };
    createMock.mockResolvedValue(fakeNotification);
    const emit = vi.fn();
    const to = vi.fn().mockReturnValue({ emit });
    const io = { to };

    await notify(mockApp(io), { user: "u2", type: "system", title: "Hey" });

    expect(to).toHaveBeenCalledWith("user:u2");
    expect(emit).toHaveBeenCalledWith("notification:new", fakeNotification);
  });

  it("does not throw when no Socket.io instance is registered", async () => {
    createMock.mockResolvedValue({ _id: "n3" });
    await expect(notify(mockApp(null), { user: "u3", type: "system", title: "Hey" })).resolves.toBeDefined();
  });
});
