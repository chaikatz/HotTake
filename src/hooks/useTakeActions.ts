import { ActionSheetIOS, Alert, Platform } from "react-native";
import { blockUser, deleteTake, reportTake } from "@/api/takes";
import type { TakeCard } from "@/types/db";
import { errorMessage } from "@/utils/errors";
import { haptic } from "@/utils/haptics";

const REASONS = ["Spam or ad", "Fake / not a real experience", "Hateful or harassing", "Sexual or violent", "Other"];

function pick(title: string, options: string[], destructive: number | undefined, onPick: (i: number) => void) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      { title, options: [...options, "Cancel"], cancelButtonIndex: options.length, destructiveButtonIndex: destructive },
      (i) => {
        if (i < options.length) onPick(i);
      },
    );
  } else {
    Alert.alert(title, undefined, [
      ...options.map((o, i) => ({ text: o, onPress: () => onPick(i), style: i === destructive ? ("destructive" as const) : ("default" as const) })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }
}

/** The "…" menu on a take: report, block, or delete your own. */
export function openTakeMenu(take: TakeCard, onDeleted?: () => void) {
  if (take.is_mine) {
    pick("Your take", ["Delete take"], 0, () => {
      Alert.alert("Delete this take?", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTake(take);
              haptic.success();
              onDeleted?.();
            } catch (e) {
              Alert.alert("Couldn't delete", errorMessage(e));
            }
          },
        },
      ]);
    });
    return;
  }
  const who = take.author_is_anonymous ? "this person" : take.author_name;
  pick("This take", ["Report take", `Block ${who}`], 1, (i) => {
    if (i === 0) {
      pick("Why are you reporting it?", REASONS, undefined, async (r) => {
        try {
          await reportTake(take.id, REASONS[r]);
          haptic.success();
          Alert.alert("Thanks for flagging it", "We'll review this take. It's hidden from your feed.");
        } catch (e) {
          Alert.alert("Couldn't report", errorMessage(e));
        }
      });
    } else {
      Alert.alert(`Block ${who}?`, "You won't see each other's takes anymore.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUser(take.author_id);
              haptic.success();
            } catch (e) {
              Alert.alert("Couldn't block", errorMessage(e));
            }
          },
        },
      ]);
    }
  });
}
