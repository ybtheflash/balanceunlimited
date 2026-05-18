import React from "react";
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from "react-native";
import { ChevronLeft, FileText } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";

export type LegalDocType = "tnc" | "privacy" | "refund" | "shipping" | "contact";

interface LegalScreenProps {
  onBack: () => void;
  docType: LegalDocType;
}

const DOCUMENTS = {
  tnc: {
    title: "Terms & Conditions",
    content: `Last updated: ${new Date().toLocaleDateString()}

1. Introduction
Welcome to Balance Unlimited. By using our app, you agree to these Terms & Conditions.

2. Virtual Currency (KC)
KC is a virtual currency used exclusively within Balance Unlimited. It has no real-world value, cannot be exchanged for fiat currency, and is non-transferable outside the platform.

3. User Accounts
You are responsible for maintaining the confidentiality of your account credentials. We reserve the right to suspend or terminate accounts that violate our terms.

4. Acceptable Use
You agree not to misuse the app, exploit bugs, or engage in any fraudulent activities.

5. Limitation of Liability
Balance Unlimited is provided "as is" without warranties. We are not liable for any direct or indirect damages arising from the use of our app.

6. Changes to Terms
We reserve the right to modify these terms at any time. Continued use of the app constitutes acceptance of the new terms.`,
  },
  privacy: {
    title: "Privacy Policy",
    content: `Last updated: ${new Date().toLocaleDateString()}

1. Information We Collect
We collect information you provide directly to us, such as when you create an account, make a purchase, or contact support. This includes your email, username, and transaction history.

2. How We Use Your Information
We use the information to provide, maintain, and improve our services, process transactions, and send related information like confirmations and support messages.

3. Data Security
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

4. Third-Party Services
We may use third-party services (like payment processors) which have their own privacy policies. We do not store your full payment details on our servers.

5. Your Rights
You have the right to request access to or deletion of your personal data. Contact us at support@zestyahh.com for any privacy-related requests.`,
  },
  refund: {
    title: "Cancellation & Refund Policy",
    content: `Last updated: ${new Date().toLocaleDateString()}

1. Digital Goods
All purchases of KC (Virtual Currency) and other digital items in Balance Unlimited are final and non-refundable. 

2. Non-Refundable Nature
Due to the immediate access and digital nature of the services and currency, we do not offer refunds or cancellations once a purchase is successfully processed and the digital goods are credited to your account.

3. Exceptional Circumstances
Refunds may only be considered in exceptional cases, such as technical errors resulting in double charges. Such requests must be made within 7 days of the transaction by contacting support@zestyahh.com.

4. Account Termination
If your account is suspended or terminated due to a violation of our Terms & Conditions, any remaining KC or purchased features will be forfeited and no refund will be provided.`,
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    content: `Last updated: ${new Date().toLocaleDateString()}

1. Digital Delivery
Balance Unlimited is a purely digital application. We do not sell or ship any physical goods.

2. Instant Delivery
Upon successful completion of a payment, the purchased digital goods (such as KC virtual currency or ad-removal) are instantly credited to your Balance Unlimited account.

3. Delivery Issues
If you have completed a purchase but do not see the items credited to your account within a few minutes, please restart the app. If the issue persists, contact our support team at support@zestyahh.com with your transaction details.`,
  },
  contact: {
    title: "Contact Us",
    content: `We are always here to help you!

Support Email: support@zestyahh.com

Operating Hours: Monday to Friday, 9:00 AM to 6:00 PM (IST)

For any queries related to your account, transactions, or general support, please drop us an email and our team will get back to you within 24-48 hours.

When contacting support regarding a transaction, please include your App ID (found in your Profile) and the transaction id.`,
  },
};

export default function LegalScreen({ onBack, docType }: LegalScreenProps) {
  const { user } = useAuth();
  const theme = user?.activeTheme || "dark";
  const isLight = theme === "light";

  const doc = DOCUMENTS[docType] || DOCUMENTS.tnc;

  return (
    <SafeAreaView className={`flex-1 ${theme === "liquidGlass" ? "bg-slate-950" : isLight ? "bg-zinc-50" : "bg-zinc-950"}`}>
      <View className="flex-1 w-full max-w-lg self-center">
        {/* Header */}
        <View className={`flex-row items-center px-4 py-4 ${isLight ? "border-zinc-200" : "border-zinc-800/50"} border-b`}>
          <TouchableOpacity
            onPress={onBack}
            className={`w-10 h-10 rounded-full items-center justify-center ${isLight ? "bg-zinc-200/70" : "bg-zinc-800"}`}
            activeOpacity={0.7}
          >
            <ChevronLeft color={isLight ? "#3f3f46" : "#e4e4e7"} size={22} />
          </TouchableOpacity>
          <View className="flex-1 ml-3 flex-row items-center gap-2">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${isLight ? "bg-blue-100" : "bg-blue-500/20"}`}>
              <FileText color={isLight ? "#2563eb" : "#60a5fa"} size={16} />
            </View>
            <Text className={`text-lg font-bold ${isLight ? "text-zinc-900" : "text-white"}`}>
              {doc.title}
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <Text className={`text-base leading-7 ${isLight ? "text-zinc-700" : "text-zinc-300"}`}>
            {doc.content}
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
