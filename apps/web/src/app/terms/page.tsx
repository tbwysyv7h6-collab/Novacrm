import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of ValensCRM.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="3 July 2026">
      <LegalSection heading="1. Agreement to these terms">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of ValensCRM, a
          no-code CRM builder operated by Ethen Beyer, trading as ValensCRM, a sole trader based in
          England and Wales (&quot;ValensCRM&quot;, &quot;we&quot;, &quot;us&quot;). By creating an
          account or using ValensCRM, you agree to these Terms. If
          you are using ValensCRM on behalf of a business, you confirm you have authority to bind
          that business to these Terms.
        </p>
      </LegalSection>

      <LegalSection heading="2. The service">
        <p>
          ValensCRM lets you build a custom customer relationship management system using
          drag-and-drop tools, templates, and an AI-assisted generator. Features, plans, and
          limits available to you depend on your subscription tier as described on our{" "}
          <Link href="/#pricing">pricing page</Link>.
        </p>
      </LegalSection>

      <LegalSection heading="3. Accounts">
        <ul>
          <li>You must provide accurate information when creating an account and keep your password secure.</li>
          <li>You are responsible for all activity that occurs under your account and for any team members you invite into your workspace.</li>
          <li>You must be at least 16 years old to use ValensCRM.</li>
          <li>We may suspend or terminate accounts that violate these Terms or applicable law.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Subscriptions and billing">
        <ul>
          <li>Paid plans are billed in advance on a recurring basis (monthly, unless otherwise agreed) via Stripe.</li>
          <li>Prices are shown in GBP and exclude any applicable tax unless stated otherwise.</li>
          <li>You can upgrade, downgrade, or cancel your subscription at any time from your billing settings; changes take effect at the start of the next billing period unless stated otherwise.</li>
          <li>Except where required by law, fees already paid are non-refundable.</li>
          <li>If a payment fails, we may downgrade your workspace to the Free plan and restrict access to paid features until payment succeeds.</li>
          <li>We may change our prices with at least 30 days&apos; notice to active subscribers; continued use after the change takes effect constitutes acceptance of the new price.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Your data">
        <p>
          You retain all ownership rights to the data you input into ValensCRM, including any
          objects, fields, records, and files you create (&quot;Customer Data&quot;). You grant us
          a limited licence to host, process, and display Customer Data solely to provide the
          service to you. We will not access Customer Data except to provide support you request,
          maintain the service, or as required by law.
        </p>
        <p>
          You are responsible for ensuring you have the right to store any personal data about
          third parties (such as your own customers) within ValensCRM, and for complying with
          applicable data protection law in respect of that data. See our{" "}
          <Link href="/privacy">Privacy Policy</Link> for how we handle data.
        </p>
      </LegalSection>

      <LegalSection heading="6. Acceptable use">
        <p>You agree not to use ValensCRM to:</p>
        <ul>
          <li>Break any applicable law, or store data you do not have the right to store.</li>
          <li>Send unsolicited communications (spam) through automations, forms, or integrations.</li>
          <li>Attempt to gain unauthorised access to another workspace or to our systems.</li>
          <li>Interfere with or disrupt the integrity or performance of the service.</li>
          <li>Reverse engineer, resell, or white-label the platform outside of a plan that explicitly permits it.</li>
          <li>Use the AI CRM Builder to generate content that is unlawful, harmful, or infringes third-party rights.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="7. AI features">
        <p>
          The AI CRM Builder uses a third-party AI model to suggest objects, fields, and views
          based on a description you provide. AI-generated output may be inaccurate or unsuitable
          for your specific needs. You are responsible for reviewing and adjusting any
          AI-generated structure before relying on it for your business.
        </p>
      </LegalSection>

      <LegalSection heading="8. Third-party integrations">
        <p>
          ValensCRM allows you to connect third-party services (for example, outbound webhooks, or
          integrations we add over time). We are not responsible for the availability, accuracy,
          or practices of third-party services, and your use of them may be subject to the third
          party&apos;s own terms.
        </p>
      </LegalSection>

      <LegalSection heading="9. Intellectual property">
        <p>
          We own all rights, title, and interest in ValensCRM itself, including its software,
          design, and branding. Nothing in these Terms transfers any of our intellectual property
          to you, other than the limited right to use the service as intended. Feedback you give
          us about the product may be used by us without restriction or compensation to you.
        </p>
      </LegalSection>

      <LegalSection heading="10. Service availability">
        <p>
          We aim to keep ValensCRM available at all times but do not guarantee uninterrupted access.
          We may perform maintenance, and features may change as the product evolves. Free and
          Starter plans are provided without any uptime service level agreement. Business plan
          customers may be offered a separate SLA on request.
        </p>
      </LegalSection>

      <LegalSection heading="11. Disclaimers and limitation of liability">
        <p>
          ValensCRM is provided &quot;as is&quot; without warranties of any kind, express or
          implied, to the maximum extent permitted by law. To the fullest extent permitted by law,
          we will not be liable for any indirect, incidental, special, or consequential damages,
          or for any loss of profits, revenue, data, or business opportunity arising from your use
          of the service. Our total liability for any claim arising out of these Terms will not
          exceed the amount you paid us in the 12 months before the claim arose. Nothing in these
          Terms limits liability that cannot be limited under applicable law, including liability
          for death, personal injury, or fraud.
        </p>
      </LegalSection>

      <LegalSection heading="12. Indemnification">
        <p>
          You agree to indemnify and hold ValensCRM harmless from any claims, damages, or expenses
          arising from your breach of these Terms, your Customer Data, or your violation of any
          law or third-party right.
        </p>
      </LegalSection>

      <LegalSection heading="13. Termination">
        <p>
          You may cancel your account at any time. We may suspend or terminate your access if you
          materially breach these Terms and do not remedy the breach within a reasonable time of
          being notified. On termination, your right to use the service ends immediately; Customer
          Data will be retained and then deleted in line with our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection heading="14. Changes to these terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we will
          notify you by email or in-app notice before they take effect. Continuing to use ValensCRM
          after changes take effect means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection heading="15. Governing law">
        <p>
          These Terms are governed by the laws of England and Wales, and any disputes will be
          subject to the exclusive jurisdiction of the courts of England and Wales, without regard
          to conflict of law principles.
        </p>
      </LegalSection>

      <LegalSection heading="16. Contact us">
        <p>
          Questions about these Terms? Email{" "}
          <a href="mailto:hello@novacrm.uk">hello@novacrm.uk</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
