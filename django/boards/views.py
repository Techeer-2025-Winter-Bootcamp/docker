from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import Board
from .serializers import BoardSerializer

@swagger_auto_schema(
    method='get',
    operation_summary='게시글 목록 조회',
    operation_description='모든 게시글을 생성일 기준 내림차순으로 조회합니다.',
    responses={
        200: BoardSerializer(many=True),
        500: 'Internal Server Error'
    }
)
@swagger_auto_schema(
    method='post',
    operation_summary='게시글 생성',
    operation_description='새로운 게시글을 생성합니다.',
    request_body=BoardSerializer,
    responses={
        201: openapi.Response(
            description='게시글 생성 성공',
            schema=BoardSerializer,
            examples={
                'application/json': {
                    'id': 1,
                    'title': '게시글 제목',
                    'content': '게시글 내용',
                    'author': '작성자',
                    'created_at': '2026-01-04T22:00:00Z',
                    'updated_at': '2026-01-04T22:00:00Z'
                }
            }
        ),
        400: openapi.Response(
            description='잘못된 요청',
            examples={
                'application/json': {
                    'title': ['This field is required.'],
                    'content': ['This field is required.']
                }
            }
        )
    }
)
@api_view(['GET', 'POST'])
def board_list(request):
    """
    게시글 목록 조회 (GET) 또는 생성 (POST)
    """
    if request.method == 'GET':
        boards = Board.objects.all()
        serializer = BoardSerializer(boards, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = BoardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

