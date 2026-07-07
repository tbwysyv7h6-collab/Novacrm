import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How NovaCRM collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="3 July 2026">
      <LegalSection heading="1. Who we are">
        <p>
          NovaCRM (&quot;NovaCRM&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides a
          no-code CRM builder that lets businesses design their own customer relationship
          management system. This policy explains what personal data we collect, why, and what
          rights you have over it. It applies to visitors of our website, users of our
          application (&quot;account holders&quot;), and, where relevant, the individuals whose
          data account holders store inside the CRMs they build (&quot;end customers&quot;).
        </p>
        <p>
          NovaCRM is operated by Ethen Beyer, trading as NovaCRM, a sole trader based in England
          and Wales at 19 Saint Johns Road, East Grinstead. If you have questions about this
          policy, contact us at{" "}
          <a href="mailto:hello@novacrm.uk">hello@novacrm.uk</a>.
        </p>
      </LegalSection>

      <LegalSection heading="2. What data we collect">
        <p>We collect the following categories of data:</p>
        <ul>
          <li>
            <strong>Account data:</strong> name, email address, password (hashed, never stored in
            plain text), and profile image if you sign in with Google or Microsoft.
          </li>
          <li>
            <strong>Workspace data:</strong> the organisations, objects, fields, records, views,
            automations, and dashboards you create inside NovaCRM — including any customer or
            business data you choose to store there.
          </li>
          <li>
            <strong>Billing data:</strong> your subscription plan and payment history. Card
            details are collected and processed directly by Stripe; we never see or store your
            full card number.
          </li>
          <li>
            <strong>Usage data:</strong> log data such as IP address, browser type, pages visited,
            and timestamps, used for security, rate-limiting, and diagnosing faults.
          </li>
          <li>
            <strong>Content you submit to AI features:</strong> if you use the AI CRM Builder, the
            business description you type is sent to our AI provider (Anthropic) to generate a
            CRM structure. We do not send your existing customer records to the AI provider as
            part of this feature.
          </li>
        </ul>
        <p>
          Where you use NovaCRM to store data about your own customers (an &quot;end
          customer&quot;), you — not NovaCRM — are the data controller for that data, and NovaCRM
          acts as a data processor on your instructions. You are responsible for having a lawful
          basis to collect and store that data and for honouring any rights requests your end
          customers make to you directly.
        </p>
      </LegalSection>

      <LegalSection heading="3. How we use your data">
        <ul>
          <li>To provide, maintain, and secure the NovaCRM service.</li>
          <li>To process payments and manage subscriptions via Stripe.</li>
          <li>To send essential account emails (email verification, password reset, automation notifications you configure).</li>
          <li>To respond to support requests.</li>
          <li>To detect, prevent, and investigate fraud, abuse, or security incidents.</li>
          <li>To improve the product, in aggregated or anonymised form wherever possible.</li>
        </ul>
        <p>We do not sell your personal data, and we do not use your workspace data to train AI models.</p>
      </LegalSection>

      <LegalSection heading="4. Legal basis for processing (UK/EU GDPR)">
        <p>Where UK GDPR or EU GDPR applies, we rely on the following legal bases:</p>
        <ul>
          <li><strong>Contract:</strong> processing necessary to provide the service you signed up for.</li>
          <li><strong>Legitimate interests:</strong> securing our systems, preventing abuse, and improving the product.</li>
          <li><strong>Consent:</strong> where you opt in to non-essential communications.</li>
          <li><strong>Legal obligation:</strong> where we must retain records for tax, accounting, or law enforcement purposes.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Who we share data with">
        <p>
          We share data with a small number of sub-processors strictly to operate the service.
          Each is bound by a data processing agreement:
        </p>
        <ul>
          <li><strong>Stripe</strong> — payment processing and subscription billing.</li>
          <li><strong>Anthropic</strong> — powers the AI CRM Builder feature.</li>
          <li><strong>Our hosting and database providers</strong> — infrastructure that stores and serves your data.</li>
          <li><strong>Our transactional email provider</strong> — delivers verification, password reset, and automation emails.</li>
        </ul>
        <p>
          We do not share your data with advertisers. If you connect a third-party integration
          (for example, an outbound webhook you configure), data will flow to the destination you
          specify — that sharing is controlled and initiated by you.
        </p>
        <p>
          We may disclose data if required by law, to protect our rights, or in connection with a
          merger, acquisition, or sale of assets, in which case we will notify affected users.
        </p>
      </LegalSection>

      <LegalSection heading="6. International data transfers">
        <p>
          Your data may be processed in countries outside your own, including the United States,
          by the sub-processors listed above. Where we transfer personal data outside the UK or
          EEA, we rely on adequacy decisions or Standard Contractual Clauses to ensure your data
          remains protected to UK/EU standards.
        </p>
      </LegalSection>

      <LegalSection heading="7. Data retention">
        <p>
          We retain account and workspace data for as long as your account is active. If you
          delete an object, field, or record inside NovaCRM, it is removed from our production
          database; backups are retained for a limited period (typically 30 days) before being
          purged. If you close your account, we delete your workspace data within 90 days, except
          where we must retain billing records for legal or tax purposes.
        </p>
      </LegalSection>

      <LegalSection heading="8. Security">
        <p>
          We use industry-standard measures to protect your data, including encryption in transit
          (TLS) and at rest, hashed passwords, role-based access controls within each workspace,
          and audit logging of sensitive account actions. No system is 100% secure, and we cannot
          guarantee absolute security of data transmitted to us.
        </p>
      </LegalSection>

      <LegalSection heading="9. Your rights">
        <p>
          Subject to applicable law, you have the right to:
        </p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate data.</li>
          <li>Request deletion of your data (&quot;right to be forgotten&quot;).</li>
          <li>Object to or restrict certain processing.</li>
          <li>Receive your data in a portable format.</li>
          <li>Withdraw consent at any time, where processing is based on consent.</li>
          <li>Lodge a complaint with your local data protection authority (in the UK, the ICO).</li>
        </ul>
        <p>
          To exercise any of these rights, email{" "}
          <a href="mailto:hello@novacrm.uk">hello@novacrm.uk</a>. We will respond within one
          month, as required by law.
        </p>
      </LegalSection>

      <LegalSection heading="10. Cookies">
        <p>
          We use strictly necessary cookies to keep you signed in and to remember your
          light/dark mode preference. We do not currently use analytics or advertising cookies. If
          this changes, we will update this policy and request consent where required.
        </p>
      </LegalSection>

      <LegalSection heading="11. Children's privacy">
        <p>
          NovaCRM is intended for business use and is not directed at children. We do not
          knowingly collect personal data from anyone under 16. If you believe a child has
          provided us with personal data, contact us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes to this policy">
        <p>
          We may update this policy from time to time. If we make material changes, we will
          notify account holders by email or via an in-app notice before the changes take effect.
        </p>
      </LegalSection>

      <LegalSection heading="13. Contact us">
        <p>
          Questions about this policy or how we handle your data? Email{" "}
          <a href="mailto:hello@novacrm.uk">hello@novacrm.uk</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
