/** The Fabric item a saved query runs against. Mirrors `SavedQueryTargetResponse`. */
export interface SavedQueryTarget {
  itemType: string;
  itemId: string;
  itemName: string;
}
