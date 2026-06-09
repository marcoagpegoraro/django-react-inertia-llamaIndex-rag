from django.core.management.base import BaseCommand

from studio.services.policy_rag import get_policy_rag_service


class Command(BaseCommand):
    help = "Build or refresh the company policy Chroma index used by the RAG demo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Rebuild the vector index even when the policy file has not changed.",
        )

    def handle(self, *args, **options):
        status = get_policy_rag_service().get_status(force=options["force"])
        self.stdout.write(
            self.style.SUCCESS(
                (
                    "Policy index ready: "
                    f'{status["chunkCount"]} chunks in "{status["collectionName"]}" '
                    f'from {status["policyFile"]}.'
                )
            )
        )
