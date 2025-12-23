from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from cvat.apps.engine.models import Shape

class ClassImageStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        task_id = request.query_params.get('task_id')
        project_id = request.query_params.get('project_id')

        queryset = Shape.objects.filter(
            label__isnull=False,
            type__in=['rectangle', 'polygon', 'polyline', 'points', 'cuboid', 'ellipse', 'mask']
        )

        if task_id:
            queryset = queryset.filter(frame__job__segment__task_id=task_id)
        elif project_id:
            queryset = queryset.filter(frame__job__segment__task__project_id=project_id)

        stats = queryset.values('label__id', 'label__name') \
                        .annotate(image_count=Count('frame', distinct=True)) \
                        .order_by('-image_count')

        result = {
            "stats": [
                {
                    "class_id": item['label__id'],
                    "class_name": item['label__name'] or f"Class {item['label__id']}",
                    "number_of_images": item['image_count']
                } for item in stats
            ]
        }
        return Response(result)