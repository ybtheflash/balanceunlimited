import { View, Image, ImageSourcePropType } from "react-native";

/**
 * Avatar map — keys stored in DB, values are require() assets.
 * "default" is always the fallback.
 */
const AVATAR_MAP: Record<string, ImageSourcePropType> = {
  default: require("../../assets/avatars/default.webp"),
  one:     require("../../assets/avatars/one.webp"),
  two:     require("../../assets/avatars/two.webp"),
  three:   require("../../assets/avatars/three.webp"),
  four:    require("../../assets/avatars/four.webp"),
  five:    require("../../assets/avatars/five.webp"),
  six:     require("../../assets/avatars/six.webp"),
  seven:   require("../../assets/avatars/seven.webp"),
  eight:   require("../../assets/avatars/eight.webp"),
  nine:    require("../../assets/avatars/nine.webp"),
  ten:     require("../../assets/avatars/ten.webp"),
  eleven:  require("../../assets/avatars/eleven.webp"),
};

export const AVATAR_KEYS = Object.keys(AVATAR_MAP);

/**
 * Get the image source for an avatar key. Falls back to "default".
 */
export function getAvatarSource(key: string): ImageSourcePropType {
  return AVATAR_MAP[key] || AVATAR_MAP.default;
}

/**
 * Renders a user avatar image from the asset library.
 */
export function UserAvatar({
  avatarKey,
  size = 96,
}: {
  avatarKey: string;
  size?: number;
}) {
  const source = getAvatarSource(avatarKey);
  const borderRadius = size * 0.3;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#3f3f46",
      }}
    >
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}
