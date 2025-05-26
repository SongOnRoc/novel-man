import { DefaultCardFactory } from "../card-factory";
import { CardContainerType } from "../types";

// 模拟 uuid 模块
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

describe("DefaultCardFactory", () => {
  let cardFactory: DefaultCardFactory;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2021-01-01'));
  });

  beforeEach(() => {
    cardFactory = new DefaultCardFactory();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test("should create an editor card with default values", () => {
    const card = cardFactory.createCard({
      title: "Test Editor Card",
      containerType: CardContainerType.EDITOR,
    });

    expect(card).toEqual(
      expect.objectContaining({
        id: "test-uuid",
        title: "Test Editor Card",
        containerType: CardContainerType.EDITOR,
        isCollapsed: true,
        isVisible: true,
        content: "",
        showAddButton: false,
        showLayoutStyleButton: false,
        showRelateButton: true,
      }),
    );

    expect(card.createdAt).toBeInstanceOf(Date);
    expect(card.updatedAt).toBeInstanceOf(Date);
  });

  test("should create a collection card with default values", () => {
    const card = cardFactory.createCard({
      title: "Test Collection Card",
      containerType: CardContainerType.COLLECTION,
    });

    expect(card).toEqual(
      expect.objectContaining({
        id: "test-uuid",
        title: "Test Collection Card",
        containerType: CardContainerType.COLLECTION,
        isCollapsed: true,
        isVisible: true,
        childCards: [],
        showAddButton: true,
        showLayoutStyleButton: true,
        showRelateButton: false,
      }),
    );

    expect(card.createdAt).toBeInstanceOf(Date);
    expect(card.updatedAt).toBeInstanceOf(Date);
  });

  test("should generate tag based on parent and props", () => {
    const card = cardFactory.createCard({
      title: "Child Card",
      containerType: CardContainerType.EDITOR,
      parent: "parent-tag",
      props: [{ name: "desc", value: "Description" }],
    });

    expect(card.tag).toBe("parent-tag-desc");
  });

  test("should generate tag based on parent and timestamp if no props or custom prop", () => {
    const card = cardFactory.createCard({
      title: "Child Card",
      containerType: CardContainerType.EDITOR,
      parent: "parent-tag",
      props: [{ name: "custom", value: "Custom Value" }],
    });

    expect(card.tag).toMatch(/^parent-tag-[a-z0-9]+$/); // timestamp in base36
  });

  test("should use provided tag if available", () => {
    const card = cardFactory.createCard({
      title: "Tagged Card",
      containerType: CardContainerType.EDITOR,
      tag: "custom-tag",
      parent: "parent-tag",
      props: [{ name: "desc", value: "Description" }],
    });

    expect(card.tag).toBe("custom-tag");
  });

  test("should respect hideTitle and isCollapsed options", () => {
    const card = cardFactory.createCard({
      title: "Options Card",
      containerType: CardContainerType.EDITOR,
      hideTitle: true,
      isCollapsed: false,
    });

    expect(card.hideTitle).toBe(true);
    expect(card.isCollapsed).toBe(false);
  });
});
