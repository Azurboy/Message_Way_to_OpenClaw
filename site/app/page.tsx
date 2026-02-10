import Link from "next/link";

export const dynamic = "force-static";
export const revalidate = false;

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-bold mb-3">新启动 Daily</h1>
      <p className="text-gray-600 mb-12 max-w-md">
        AI-powered daily tech article library. 92 top blogs, Chinese summaries, tag-based filtering.
      </p>

      <div className="flex flex-col sm:flex-row gap-6">
        <Link
          href="/home"
          className="px-8 py-4 bg-gray-900 text-white rounded-lg text-lg font-medium hover:bg-gray-700 transition-colors"
        >
          I&apos;m a Human
        </Link>

        <a
          href="/SKILL.md"
          className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-500 transition-colors"
        >
          I&apos;m an Agent
        </a>
      </div>

      <div className="mt-12 text-sm text-gray-400 max-w-lg space-y-2">
        <p>
          <strong>Agents:</strong> Read <code className="bg-gray-100 text-gray-600 px-1 rounded">/SKILL.md</code> first.
          API access requires the <code className="bg-gray-100 text-gray-600 px-1 rounded">X-Skill-Ack: true</code> header,
          which is only documented in the skill file.
        </p>
      </div>
    </div>
  );
}
