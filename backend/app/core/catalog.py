"""Competency names, roles, and verified learning resources."""
from urllib.parse import quote_plus

from .roles import ROLE_PROFILES

DIMENSIONS = ["Knowledge", "Application", "Problem Solving", "Debugging", "Reasoning",
              "Adaptation", "Transfer", "Testing", "Engineering", "Deployment", "Security"]
ROLES = {name: p["skills"] for name, p in ROLE_PROFILES.items()}
SKILLS = sorted({s for p in ROLE_PROFILES.values() for s in p["skills"]} - set(DIMENSIONS))
ALL_KEYS = DIMENSIONS + SKILLS
ROLE_SKILLS = sorted({s for p in ROLE_PROFILES.values() for s in p["skills"]})

PROJECT_TASKS = {
    "Testing": "Add pytest tests (including edge cases) to one of your existing projects.",
    "Docker": "Containerise one of your apps with a Dockerfile and run it from the image.",
    "Deployment": "Deploy an existing project to Render or Vercel and document the live URL.",
    "FastAPI": "Expose your model or script as a FastAPI endpoint with request validation.",
    "SQL": "Add a Postgres schema and three joined queries to a project.",
    "Debugging": "Fix three real bugs in a project and write down the root cause of each.",
    "Transfer": "Re-implement an idea from one project in a completely different domain.",
    "Security": "Review one project against the OWASP Top 10 and fix two findings.",
}


def _yt(q):
    return {"title": f"YouTube search: {q}", "type": "youtube-search", "level": "any",
            "url": "https://www.youtube.com/results?search_query=" + quote_plus(q)}


def _doc(title, url, kind="docs", level="beginner"):
    return {"title": title, "type": kind, "level": level, "url": url}


RESOURCES = {
    "Python": [
        _doc("The Python Tutorial (official)", "https://docs.python.org/3/tutorial/"),
    ],

    "Pandas": [
        _doc("Pandas getting started (official)", "https://pandas.pydata.org/docs/getting_started/index.html"),
        _doc("Kaggle Learn: Pandas", "https://www.kaggle.com/learn/pandas", "course"),
    ],

    "Machine Learning": [
        _doc("scikit-learn user guide (official)", "https://scikit-learn.org/stable/user_guide.html", level="intermediate"),
        _doc("Kaggle Learn: Intro to Machine Learning", "https://www.kaggle.com/learn/intro-to-machine-learning", "course"),
    ],

    "SQL": [
        _doc("PostgreSQL tutorial (official)", "https://www.postgresql.org/docs/current/tutorial.html"),
        _doc("Kaggle Learn: Intro to SQL", "https://www.kaggle.com/learn/intro-to-sql", "course"),
        _doc("PostgreSQL learning resource", "https://youtu.be/cnzka7kF5Zk?si=LZPFDTDjUp15FHfT", "youtube"),
        _doc("PostgreSQL learning resource", "https://youtu.be/lZi8zVfNoO0?si=m4VfMrwksbCBXsar", "youtube"),
        _doc("PostgreSQL learning resource", "https://youtu.be/qw--VYLpxG4?si=-3abpnG70h2twHRg", "youtube"),
    ],

    "FastAPI": [
        _doc("FastAPI tutorial (official)", "https://fastapi.tiangolo.com/tutorial/"),
    ],

    "Docker": [
        _doc("Docker get started (official)", "https://docs.docker.com/get-started/"),
    ],

    "Testing": [
        _doc("pytest getting started (official)", "https://docs.pytest.org/en/stable/getting-started.html"),
    ],

    "Debugging": [
        _doc("Python pdb debugger (official)", "https://docs.python.org/3/library/pdb.html", level="intermediate"),
    ],

    "Deployment": [
        _doc("Render documentation", "https://render.com/docs"),
        _doc("Vercel documentation", "https://vercel.com/docs"),
    ],

    "Engineering": [
        _doc("The Twelve-Factor App", "https://12factor.net/", "article", "intermediate"),
    ],

    "APIs": [
        _doc("MDN: HTTP overview", "https://developer.mozilla.org/en-US/docs/Web/HTTP"),
    ],

    "Packaging": [
        _doc(
            "Python Packaging User Guide: packaging a project",
            "https://packaging.python.org/en/latest/tutorials/packaging-projects/"
        ),
    ],

    "JavaScript": [
        _doc("MDN: Learn web development", "https://developer.mozilla.org/en-US/docs/Learn"),
    ],

    "React": [
        _doc("React: Learn", "https://react.dev/learn"),
        _doc("React & Next.js learning resource", "https://youtu.be/cHIn7PUAxlg?si=wmP6ivW_0AhsSASx", "youtube"),
        _doc("React & Next.js learning resource", "https://youtu.be/9koAAfPCBxM?si=ABB8mlZHLFMBb6qm", "youtube"),
        _doc("React & Next.js learning resource", "https://youtu.be/JPT3bFIwJYA?si=TBN-1unsaTI6JhtG", "youtube"),
        _doc("React & Next.js learning resource", "https://youtu.be/bMknfKXIFA8?si=E6pxI6gC3mEGgKQq", "youtube"),
    ],

    "CSS": [
        _doc("MDN: CSS", "https://developer.mozilla.org/en-US/docs/Web/CSS"),
    ],

    "Accessibility": [
        _doc(
            "MDN: Accessibility",
            "https://developer.mozilla.org/en-US/docs/Web/Accessibility",
            level="intermediate"
        ),
    ],

    "Security": [
        _doc("OWASP Top 10", "https://owasp.org/www-project-top-ten/", "article", "intermediate"),
    ],

    "Web Security": [
        _doc("OWASP Top 10", "https://owasp.org/www-project-top-ten/", "article", "intermediate"),
    ],

    "Statistics": [
        _doc(
            "Khan Academy: Statistics and probability",
            "https://www.khanacademy.org/math/statistics-probability",
            "course"
        ),
    ],

    "CI/CD": [
        _doc("GitHub Actions documentation", "https://docs.github.com/en/actions"),
        _doc("CI/CD learning resource", "https://youtu.be/y4RcDlfYKB8?si=cTe8KWhziuEhSE0-", "youtube"),
        _doc("CI/CD learning resource", "https://youtu.be/tgmM3_2dZwg?si=-TW19MZq0eW-p8Qc", "youtube"),
        _doc("CI/CD learning resource", "https://youtu.be/5KtRF4NuUWE?si=cnAHganqyNz_hxFQ", "youtube"),
        _doc("CI/CD learning resource", "https://youtu.be/OsrPBLCQPFI?si=GsDKrvVwjxRBS-RU", "youtube"),
    ],

    "Backend Engineering": [
        _doc("Backend engineering resource", "https://youtu.be/V3ZPPPKEipA?si=Z_--4waCeqybLqnB", "youtube"),
        _doc("Backend engineering resource", "https://youtu.be/i7twT3x5yv8?si=Xr2jT3FvE8MAzuNz", "youtube"),
        _doc("Backend engineering resource", "https://youtu.be/UzLMhqg3_Wc?si=roRubliotgOlGX8h", "youtube"),
        _doc("Backend engineering resource", "https://youtu.be/UmljXZIypDc?si=LibMzst2O3ECk4Kg", "youtube"),
        _doc("Backend engineering resource", "https://youtu.be/t-uAgI-AUxc?si=ynuJo0Zeg5WdZwBq", "youtube"),
    ],

    "Frontend Engineering": [
        _doc("Frontend engineering resource", "https://youtu.be/Qrsp4WY3axk?si=yjbSj8x5vns6NW1g", "youtube"),
        _doc("Frontend engineering resource", "https://youtu.be/deR3T80xcZE?si=SaL-fRGT7ivsAmLc", "youtube"),
        _doc("Frontend engineering resource", "https://youtu.be/BI1o2H9z9fo?si=L8Be2_HL6616-h4M", "youtube"),
        _doc("Frontend engineering resource", "https://youtu.be/1Rs2ND1ryYc?si=gq0QDv8YJb9j7w6e", "youtube"),
        _doc("Frontend engineering resource", "https://youtu.be/4UZrsTqkcW4?si=wCsNbLQp6tASQQn7", "youtube"),
    ],

    "Full Stack Engineering": [
        _doc("Full stack engineering resource", "https://youtu.be/kJEsTjH5mVg?si=wxzzIoBgFi2-gWRn", "youtube"),
        _doc("Full stack engineering resource", "https://youtu.be/Eafgk0GbEUg?si=CN1vuvWYPK-vH8CB", "youtube"),
        _doc("Full stack engineering resource", "https://youtu.be/c-QsfbznSXI?si=cBltGk0tmog5MmV4", "youtube"),
        _doc("Full stack engineering resource", "https://youtu.be/Oe421EPjeBE?si=QgcRg2ZqMmunCj7n", "youtube"),
        _doc("Full stack engineering resource", "https://youtu.be/LzMnsfqjzkA?si=a24X7eMpOXfCojxv", "youtube"),
    ],

    "Kubernetes": [
        _doc("Kubernetes concepts (official)", "https://kubernetes.io/docs/concepts/"),
        _doc("Kubernetes architecture (official)", "https://kubernetes.io/docs/concepts/architecture/"),
        _doc("Kubernetes workloads (official)", "https://kubernetes.io/docs/concepts/workloads/"),
        _doc("Kubernetes services and networking (official)", "https://kubernetes.io/docs/concepts/services-networking/"),
        _doc("Kubernetes storage (official)", "https://kubernetes.io/docs/concepts/storage/"),
        _doc("Kubernetes configuration (official)", "https://kubernetes.io/docs/concepts/configuration/"),
        _doc("Kubernetes security (official)", "https://kubernetes.io/docs/concepts/security/"),
    ],

    "AWS": [
        _doc("AWS overview (official)", "https://docs.aws.amazon.com/pdfs/whitepapers/latest/aws-overview/aws-overview.pdf", "pdf"),
        _doc("AWS cloud foundations", "https://github.com/YashGarg11/aws-cloud-foundations-notes", "course"),
        _doc("AWS EC2 notes", "https://github.com/YashGarg11/aws-cloud-foundations-notes/blob/main/ec2.pdf", "pdf"),
        _doc("AWS S3 notes", "https://github.com/YashGarg11/aws-cloud-foundations-notes/blob/main/AWS%20S3%20Service.pdf", "pdf"),
        _doc("AWS VPC notes", "https://github.com/YashGarg11/aws-cloud-foundations-notes/blob/main/Amazon%20VPC.pdf", "pdf"),
        _doc("AWS RDS notes", "https://github.com/YashGarg11/aws-cloud-foundations-notes/blob/main/AMAZON%20RDS.pdf", "pdf"),
        _doc("AWS EKS notes", "https://github.com/YashGarg11/aws-cloud-foundations-notes/blob/main/aws%20eks%20service.pdf", "pdf"),
    ],

    "Azure": [
        _doc(
            "Microsoft Azure Cloud Adoption Framework",
            "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/",
            "docs"
        ),
        _doc(
            "Azure landing zones",
            "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/",
            "docs"
        ),
        _doc(
            "Azure landing zone design areas",
            "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/design-areas",
            "docs"
        ),
        _doc(
            "Azure Fundamentals study guide",
            "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900",
            "course"
        ),
        _doc(
            "Azure Administrator study guide",
            "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104",
            "course"
        ),
        _doc(
            "Azure architecture",
            "https://learn.microsoft.com/en-us/azure/architecture/",
            "docs"
        ),
    ],

    "Google Cloud": [
        _doc(
            "Google Cloud documentation",
            "https://docs.cloud.google.com/",
            "docs"
        ),
        _doc(
            "Google Cloud IAM",
            "https://docs.cloud.google.com/iam/docs",
            "docs"
        ),
        _doc(
            "Google Cloud getting started",
            "https://docs.cloud.google.com/docs/get-started",
            "docs"
        ),
        _doc(
            "Google Cloud Storage",
            "https://cloud.google.com/docs/storage",
            "docs"
        ),
        _doc(
            "Google Cloud IAM security architecture",
            "https://docs.cloud.google.com/iam/docs/iam-security-architecture",
            "docs",
            "intermediate"
        ),
        _doc(
            "Google Cloud identity architecture",
            "https://docs.cloud.google.com/architecture/identity",
            "docs",
            "intermediate"
        ),
    ],

    "Git": [
        _doc("Git and GitHub learning resource", "https://youtu.be/q8EevlEpQ2A?si=CGu0FI-x0ZAWOUH2", "youtube"),
        _doc("Git and GitHub learning resource", "https://youtu.be/apGV9Kg7ics?si=P2PfZO6_-qB2nqYO", "youtube"),
        _doc("Git and GitHub learning resource", "https://youtu.be/Jdc0i7RcBv8?si=eodedU-DUhRoFlQD", "youtube"),
        _doc("Git and GitHub learning resource", "https://youtu.be/fUdHTZcfoDY?si=Z8vaFJ-n4T_Xn7em", "youtube"),
        _doc("Git and GitHub learning resource", "https://youtu.be/RGOj5yH7evk?si=K86b_WCb3rYJ0TF_", "youtube"),
    ],

    "GitHub": [
        _doc("Git and GitHub learning resource", "https://youtu.be/q8EevlEpQ2A?si=CGu0FI-x0ZAWOUH2", "youtube"),
        _doc("Git and GitHub learning resource", "https://youtu.be/apGV9Kg7ics?si=P2PfZO6_-qB2nqYO", "youtube"),
        _doc("Git and GitHub learning resource", "https://youtu.be/Jdc0i7RcBv8?si=eodedU-DUhRoFlQD", "youtube"),
        _doc("Git and GitHub learning resource", "https://youtu.be/fUdHTZcfoDY?si=Z8vaFJ-n4T_Xn7em", "youtube"),
        _doc("Git and GitHub learning resource", "https://youtu.be/RGOj5yH7evk?si=K86b_WCb3rYJ0TF_", "youtube"),
    ],

    "LLM Evaluation": [
        _doc("LLM evaluation learning resource", "https://youtu.be/6W92_t9FveA?si=ylD3Vj3EyzephMd_", "youtube"),
        _doc("LLM evaluation learning resource", "https://youtu.be/uQFLY8rQVYA?si=tEemnsjEseD9Wh-X", "youtube"),
        _doc("LLM evaluation learning resource", "https://youtu.be/NebOSOTp-zA?si=gLnsVVDVPdLtkY1A", "youtube"),
        _doc("LLM evaluation learning resource", "https://youtu.be/rQE3w8Qjx98?si=WTcA9i2knKn4Q8Q6", "youtube"),
        _doc("LLM evaluation learning resource", "https://youtu.be/5yjcbQDLLnw?si=4QnPzY7ZqSnOGCIF", "youtube"),
    ],

    "RAG": [
        _doc("RAG and retrieval learning resource", "https://youtu.be/DKg6XUnclm8?si=EcA-slDCBZtESyZS", "youtube"),
        _doc("RAG and retrieval learning resource", "https://youtu.be/mHxLXzYjQRE?si=1VKNXQqNHUGiws9-", "youtube"),
        _doc("RAG and retrieval learning resource", "https://youtu.be/sVcwVQRHIc8?si=KY2p_qkM8qtGSSO3", "youtube"),
        _doc("RAG and retrieval learning resource", "https://youtu.be/YLPNA1j7kmQ?si=J4oZMJFVrqRKTDtt", "youtube"),
        _doc("RAG and retrieval learning resource", "https://youtu.be/QdDoFfkVkcw?si=YndSr9mrPbqmxK8K", "youtube"),
    ],

    "Observability": [
        _doc("Observability and reliability learning resource", "https://youtu.be/9DqOMZrc4PA?si=bZ7OMZeXu4sSPgwS", "youtube"),
        _doc("Observability and reliability learning resource", "https://youtu.be/tgmM3_2dZwg?si=xsqSly05eH1NkYI0", "youtube"),
        _doc("Observability and reliability learning resource", "https://youtu.be/i-_n7ee_u2E?si=1CBwnumh9NYqvb9D", "youtube"),
        _doc("Observability and reliability learning resource", "https://youtu.be/umm-MyCl3Q4?si=FhdYw9rePSUxC0Gg", "youtube"),
        _doc("Observability and reliability learning resource", "https://youtu.be/h4Sl21AKiDg?si=4DLzBfdOh7xRC8z-", "youtube"),
    ],

    "Reliability": [
        _doc("Observability and reliability learning resource", "https://youtu.be/9DqOMZrc4PA?si=bZ7OMZeXu4sSPgwS", "youtube"),
        _doc("Observability and reliability learning resource", "https://youtu.be/tgmM3_2dZwg?si=xsqSly05eH1NkYI0", "youtube"),
        _doc("Observability and reliability learning resource", "https://youtu.be/i-_n7ee_u2E?si=1CBwnumh9NYqvb9D", "youtube"),
        _doc("Observability and reliability learning resource", "https://youtu.be/umm-MyCl3Q4?si=FhdYw9rePSUxC0Gg", "youtube"),
        _doc("Observability and reliability learning resource", "https://youtu.be/h4Sl21AKiDg?si=4DLzBfdOh7xRC8z-", "youtube"),
    ],

    "Linux": [
        _doc("Linux and networking learning resource", "https://youtu.be/8usykf7J30g?si=naHZS85kfq-Hzuyq", "youtube"),
        _doc("Linux and networking learning resource", "https://youtu.be/N3DEyU9j19Y?si=jdXkFVyOXjFKFthO", "youtube"),
        _doc("Linux and networking learning resource", "https://youtu.be/sWbUDq4S6Y8?si=s5i9z48wll3LDHjt", "youtube"),
        _doc("Linux and networking learning resource", "https://youtu.be/2PGnYjbYuUo?si=sCad5Ia2uFDJ_hx6", "youtube"),
        _doc("Linux and networking learning resource", "https://youtu.be/iSOfkw_YyOU?si=PfP6ThgLMRmEssKv", "youtube"),
    ],

    "Networking": [
        _doc("Linux and networking learning resource", "https://youtu.be/8usykf7J30g?si=naHZS85kfq-Hzuyq", "youtube"),
        _doc("Linux and networking learning resource", "https://youtu.be/N3DEyU9j19Y?si=jdXkFVyOXjFKFthO", "youtube"),
        _doc("Linux and networking learning resource", "https://youtu.be/sWbUDq4S6Y8?si=s5i9z48wll3LDHjt", "youtube"),
        _doc("Linux and networking learning resource", "https://youtu.be/2PGnYjbYuUo?si=sCad5Ia2uFDJ_hx6", "youtube"),
        _doc("Linux and networking learning resource", "https://youtu.be/iSOfkw_YyOU?si=PfP6ThgLMRmEssKv", "youtube"),
    ],

    "Terraform": [
        _doc("Terraform and infrastructure as code learning resource", "https://youtu.be/4JYtAf4M88Y?si=O_fDwIvsJa4HZCwo", "youtube"),
        _doc("Terraform and infrastructure as code learning resource", "https://youtu.be/HoAUERBrc1k?si=nkxrR1GyHk_vZULy", "youtube"),
        _doc("Terraform and infrastructure as code learning resource", "https://youtu.be/7xngnjfIlK4?si=Am9-W7b53LsPugzP", "youtube"),
        _doc("Terraform and infrastructure as code learning resource", "https://youtu.be/bEXfPzoB4RE?si=qvvfe8cWYT2fl0By", "youtube"),
        _doc("Terraform and infrastructure as code learning resource", "https://youtu.be/SLB_c_ayRMo?si=RRdRLeU2D2kdY46u", "youtube"),
    ],

    "Infrastructure as Code": [
        _doc("Terraform and infrastructure as code learning resource", "https://youtu.be/4JYtAf4M88Y?si=O_fDwIvsJa4HZCwo", "youtube"),
        _doc("Terraform and infrastructure as code learning resource", "https://youtu.be/HoAUERBrc1k?si=nkxrR1GyHk_vZULy", "youtube"),
        _doc("Terraform and infrastructure as code learning resource", "https://youtu.be/7xngnjfIlK4?si=Am9-W7b53LsPugzP", "youtube"),
        _doc("Terraform and infrastructure as code learning resource", "https://youtu.be/bEXfPzoB4RE?si=qvvfe8cWYT2fl0By", "youtube"),
        _doc("Terraform and infrastructure as code learning resource", "https://youtu.be/SLB_c_ayRMo?si=RRdRLeU2D2kdY46u", "youtube"),
    ],

    "Product Engineering": [
        _doc("Product engineering learning resource", "https://youtu.be/Wnk_pArBylM?si=yW59L5QXeHCSc18G", "youtube"),
        _doc("Product engineering learning resource", "https://youtu.be/_2yqqaL2lbs?si=KUfvbEHa2zaFqcul", "youtube"),
        _doc("Product engineering learning resource", "https://youtu.be/8jH07r6135o?si=uYMkFptzDugBKRcV", "youtube"),
        _doc("Product engineering learning resource", "https://youtu.be/e_5aDYO-2ys?si=FZJLiB8yUF0F295e", "youtube"),
        _doc("Product engineering learning resource", "https://youtu.be/pQ9gtaGd-Os?si=8tOOrc14TKyaXgq-", "youtube"),
    ],

    "Distributed Systems": [
        _doc("Distributed systems learning resource", "https://youtu.be/GNhLl0tMToE?si=4cTH6fQ0vhnjY_G6", "youtube"),
        _doc("Distributed systems learning resource", "https://youtu.be/klUH2wqxzyw?si=v1oatUuinwiMDBq3", "youtube"),
        _doc("Distributed systems learning resource", "https://youtu.be/cQP8WApzIQQ?si=dh2DAMMDWemaE3fV", "youtube"),
        _doc("Distributed systems learning resource", "https://youtu.be/gA4YXUJX7t8?si=pHMz7aq9facEmvjP", "youtube"),
        _doc("Distributed systems learning resource", "https://youtu.be/M_teob23ZzY?si=UnxMapMoXeyR5zgF", "youtube"),
    ],

    "UI Engineering": [
        _doc("UI engineering learning resource", "https://youtu.be/6l8RWV8D-Yo?si=QuJ5GQJWNAIOKaL_", "youtube"),
        _doc("UI engineering learning resource", "https://youtu.be/zJSY8tbf_ys?si=ba4v745Kviw3e0MN", "youtube"),
        _doc("UI engineering learning resource", "https://youtu.be/srBwRDiC3Pg?si=H9U4vtpzBFCZ0k_O", "youtube"),
        _doc("UI engineering learning resource", "https://youtu.be/RbxHZwFtRT4?si=BRIpkik3Xr9rqQXg", "youtube"),
        _doc("UI engineering learning resource", "https://youtu.be/F627pKNUCVQ?si=96zSDv2zoM-FYMR4", "youtube"),
    ],

    "Data Engineering": [
        _doc("Data engineering learning resource", "https://youtu.be/SETspQRY9ZU?si=CxzJPun67d9bIzCd", "youtube"),
        _doc("Data engineering learning resource", "https://youtu.be/O_OMFMlPPZs?si=yOHK89-FSk96RVcX", "youtube"),
        _doc("Data engineering learning resource", "https://youtu.be/PHsC_t0j1dU?si=mNs5_OLy73a2H-u-", "youtube"),
        _doc("Data engineering learning resource", "https://youtu.be/oJUM7jJGzl4?si=JWW251BEhlwG15af", "youtube"),
        _doc("Data engineering learning resource", "https://youtu.be/T23Bs75F7ZQ?si=uRUDM_EuJrN66qHO", "youtube"),
    ],

    "Flutter": [
        _doc("Flutter and Dart learning resource", "https://youtu.be/j-LOab_PzzU?si=mAKvXZ3B417tM30G", "youtube"),
        _doc("Flutter and Dart learning resource", "https://youtu.be/56xvk6OHTpM?si=uluAkt4B0YCdVqDv", "youtube"),
        _doc("Flutter and Dart learning resource", "https://youtu.be/VPvVD8t02U8?si=99uOtQupsJBNka0g", "youtube"),
        _doc("Flutter and Dart learning resource", "https://youtu.be/BiOSCpV-lts?si=eNnDBgrhcA61x8al", "youtube"),
        _doc("Flutter and Dart learning resource", "https://youtu.be/CzRQ9mnmh44?si=DNEpHqDya_f6PyPj", "youtube"),
    ],

    "Dart": [
        _doc("Flutter and Dart learning resource", "https://youtu.be/j-LOab_PzzU?si=mAKvXZ3B417tM30G", "youtube"),
        _doc("Flutter and Dart learning resource", "https://youtu.be/56xvk6OHTpM?si=uluAkt4B0YCdVqDv", "youtube"),
        _doc("Flutter and Dart learning resource", "https://youtu.be/VPvVD8t02U8?si=99uOtQupsJBNka0g", "youtube"),
        _doc("Flutter and Dart learning resource", "https://youtu.be/BiOSCpV-lts?si=eNnDBgrhcA61x8al", "youtube"),
        _doc("Flutter and Dart learning resource", "https://youtu.be/CzRQ9mnmh44?si=DNEpHqDya_f6PyPj", "youtube"),
    ],

    "Deep Learning": [
        _doc("Deep learning learning resource", "https://youtu.be/YFNKnUhm_-s?si=CmKpkp5STm5yfEoV", "youtube"),
        _doc("Deep learning learning resource", "https://youtu.be/d2kxUVwWWwU?si=gyLYvfYbWf_xxXFt", "youtube"),
        _doc("Deep learning learning resource", "https://youtu.be/tPYj3fFJGjk?si=wSaFLstOIuMDl3h0", "youtube"),
        _doc("Deep learning learning resource", "https://youtu.be/V_xro1bcAuA?si=jCt78BsxUL9_5m8p", "youtube"),
        _doc("Deep learning learning resource", "https://youtu.be/CNuI8OWsppg?si=0Qnp7rbtDih85Tqs", "youtube"),
    ],

    # Keep the original official/general resources for skills already
    # supported by the project.
    "AWS Cloud": [
        _doc("AWS overview (official)", "https://docs.aws.amazon.com/pdfs/whitepapers/latest/aws-overview/aws-overview.pdf", "pdf"),
    ],

    "Cloud": [
        _doc("AWS overview (official)", "https://docs.aws.amazon.com/pdfs/whitepapers/latest/aws-overview/aws-overview.pdf", "pdf"),
        _doc("Azure Cloud Adoption Framework", "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/", "docs"),
        _doc("Google Cloud documentation", "https://docs.cloud.google.com/", "docs"),
    ],
}


def resources_for(key):
    return RESOURCES.get(key, []) + [_yt(f"{key} tutorial for developers")]


def modules_for(skill: str) -> list[dict]:
    mods = [{"key": f"resource-{i}", "title": r["title"], "type": r["type"], "url": r["url"]}
            for i, r in enumerate(resources_for(skill))]
    mods.append({"key": "project", "type": "project", "url": None,
                 "title": PROJECT_TASKS.get(skill, f"Apply {skill} in one of your projects.")})
    return mods